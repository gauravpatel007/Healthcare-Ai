"""
LifeOS Backend — Medical Records Router
CRUD + file upload + AI summary.
"""

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUserId
from app.exceptions import NotFoundException
from app.models.medical_record import MedicalRecord
from app.schemas.medical_record import RecordCreate, RecordResponse, RecordUpdate, RecordCompareRequest
from app.services import file_service, ai_service

router = APIRouter(prefix="/records", tags=["Medical Records"])


@router.get("", response_model=list[RecordResponse])
async def list_records(
    user_id: CurrentUserId,
    category: str | None = None,
    search: str | None = None,
    family_member_id: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """List medical records with optional filtering."""
    query = select(MedicalRecord).where(MedicalRecord.user_id == user_id)
    if category and category != "all":
        query = query.where(MedicalRecord.category == category)
        
    if family_member_id:
        query = query.where(MedicalRecord.family_member_id == family_member_id)
    else:
        query = query.where(MedicalRecord.family_member_id.is_(None))
    query = query.order_by(MedicalRecord.created_at.desc())

    result = await db.execute(query)
    records = result.scalars().all()

    if search:
        q = search.lower()
        records = [r for r in records if q in (r.title or "").lower() or q in (r.doctor or "").lower() or q in (r.hospital or "").lower()]

    return records


@router.get("/{record_id}", response_model=RecordResponse)
async def get_record(record_id: str, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Get a single medical record."""
    result = await db.execute(
        select(MedicalRecord).where(MedicalRecord.id == record_id, MedicalRecord.user_id == user_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise NotFoundException("Medical record", record_id)
    return record


@router.post("", response_model=RecordResponse, status_code=201)
async def create_record(
    user_id: CurrentUserId,
    title: str = Form(...),
    category: str = Form(...),
    doctor: str = Form(""),
    hospital: str = Form(""),
    date: str = Form(None),
    findings: str = Form(None),
    notes: str = Form(None),
    family_member_id: str | None = Form(None),
    file: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
):
    """Create a medical record with optional file upload."""
    file_path = None
    if file and file.filename:
        file_path = await file_service.save_upload_file(file, user_id)

    parsed_date = None
    if date:
        from datetime import datetime
        try:
            parsed_date = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            parsed_date = None

    record = MedicalRecord(
        user_id=user_id,
        title=title,
        category=category,
        doctor=doctor,
        hospital=hospital,
        date=parsed_date,
        findings=findings,
        notes=notes,
        file_path=file_path,
        family_member_id=family_member_id,
    )
    db.add(record)
    await db.flush()
    await db.refresh(record)
    await db.commit()
    return record


@router.put("/{record_id}", response_model=RecordResponse)
async def update_record(
    record_id: str, data: RecordUpdate, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)
):
    """Update a medical record."""
    result = await db.execute(
        select(MedicalRecord).where(MedicalRecord.id == record_id, MedicalRecord.user_id == user_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise NotFoundException("Medical record", record_id)

    update_data = data.model_dump(exclude_unset=True)
    if "date" in update_data and isinstance(update_data["date"], str):
        from datetime import datetime
        try:
            update_data["date"] = datetime.strptime(update_data["date"], "%Y-%m-%d").date()
        except ValueError:
            pass # fallback to whatever string it is, or let it fail naturally

    for key, value in update_data.items():
        setattr(record, key, value)
    await db.flush()
    await db.commit()
    return record


@router.delete("/{record_id}")
async def delete_record(record_id: str, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Delete a medical record."""
    result = await db.execute(
        select(MedicalRecord).where(MedicalRecord.id == record_id, MedicalRecord.user_id == user_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise NotFoundException("Medical record", record_id)

    if record.file_path:
        file_service.delete_file(record.file_path)

    await db.delete(record)
    await db.flush()
    await db.commit()
    return {"success": True, "message": "Record deleted"}


@router.post("/{record_id}/ai-summary")
async def ai_record_summary(record_id: str, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Generate an AI summary of a medical record."""
    result = await db.execute(
        select(MedicalRecord).where(MedicalRecord.id == record_id, MedicalRecord.user_id == user_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise NotFoundException("Medical record", record_id)

    extracted_text = ""
    if record.file_path:
        try:
            import fitz
            full_path = file_service.get_file_path(record.file_path)
            if full_path:
                doc = fitz.open(str(full_path))
                for page in doc:
                    extracted_text += page.get_text()
                doc.close()
        except Exception:
            pass

    FORMATTING_PROMPT = """
Format your response following these rules:
1. Never return plain text paragraphs. Always use Markdown (headings, bold, lists, tables).
2. Structure the report professionally with sections like Patient Information, Test Results (in a table with Normal Ranges and Status), Key Findings, Recommendations, and Conclusion.
3. Highlight abnormal values using 🔴 (Low/High/High Risk), 🟠 (Moderate), 🟡 (Slightly Abnormal), and ✅ (Normal).
4. Do not output raw JSON. Use clean GitHub-flavored Markdown.
"""

    prompt = f"Summarize this medical record:\nTitle: {record.title}\nCategory: {record.category}\nDoctor: {record.doctor}\nHospital: {record.hospital}\nFindings: {record.findings or 'None'}\nNotes: {record.notes or 'None'}"
    if extracted_text.strip():
        prompt += f"\n\nDocument Text:\n{extracted_text[:6000]}"
    
    prompt += "\n\n" + FORMATTING_PROMPT
        
    summary = await ai_service.generate_ai_response("assistant", prompt)

    return {
        "record_id": record.id,
        "summary": summary,
        "disclaimer": "This is an AI-generated summary. Always consult your doctor for medical advice.",
    }


@router.post("/compare")
async def compare_records(data: RecordCompareRequest, user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):
    """Compare two medical records using AI."""
    r1 = await db.execute(select(MedicalRecord).where(MedicalRecord.id == data.record_id_1, MedicalRecord.user_id == user_id))
    r2 = await db.execute(select(MedicalRecord).where(MedicalRecord.id == data.record_id_2, MedicalRecord.user_id == user_id))
    record1 = r1.scalar_one_or_none()
    record2 = r2.scalar_one_or_none()

    if not record1 or not record2:
        raise NotFoundException("One or both records not found")

    def extract_text(r):
        text = ""
        if r.file_path:
            try:
                import fitz
                full_path = file_service.get_file_path(r.file_path)
                if full_path:
                    doc = fitz.open(str(full_path))
                    for page in doc:
                        text += page.get_text()
                    doc.close()
            except Exception:
                pass
        return text

    t1 = extract_text(record1)
    t2 = extract_text(record2)

    FORMATTING_PROMPT = """
Format your response following these rules:
1. Never return plain text paragraphs. Always use Markdown (headings, bold, lists, tables).
2. Structure the comparison professionally, using tables to compare values between the two records.
3. Highlight abnormal values or significant changes using 🔴 (High Risk/Worse), 🟠 (Moderate), 🟡 (Slightly Abnormal), and ✅ (Normal/Improved).
4. Do not output raw JSON. Use clean GitHub-flavored Markdown.
"""

    prompt = f"Compare these two medical records:\n\nRecord 1: {record1.title} ({record1.date}) - {record1.findings}\n"
    if t1.strip():
        prompt += f"Document Text 1:\n{t1[:3000]}\n"
        
    prompt += f"\nRecord 2: {record2.title} ({record2.date}) - {record2.findings}\n"
    if t2.strip():
        prompt += f"Document Text 2:\n{t2[:3000]}\n"
        
    prompt += "\nProvide a comparison and highlight any significant changes.\n\n" + FORMATTING_PROMPT
    
    comparison = await ai_service.generate_ai_response("assistant", prompt)

    return {
        "record_1": {"id": record1.id, "title": record1.title, "date": str(record1.date), "findings": record1.findings},
        "record_2": {"id": record2.id, "title": record2.title, "date": str(record2.date), "findings": record2.findings},
        "comparison": comparison,
    }


# ─── Metric-to-category mapping ─────────────────────────────────────

METRIC_CATEGORY_MAP = {
    "blood sugar": "blood_sugar",
    "glucose": "blood_sugar",
    "fasting glucose": "blood_sugar",
    "random glucose": "blood_sugar",
    "hba1c": "blood_sugar",
    "cholesterol": "cholesterol",
    "total cholesterol": "cholesterol",
    "hdl": "cholesterol",
    "ldl": "cholesterol",
    "triglycerides": "cholesterol",
    "weight": "weight",
    "heart rate": "heart_rate",
    "pulse": "heart_rate",
    "systolic": "blood_pressure",
    "diastolic": "blood_pressure",
    "blood pressure": "blood_pressure",
}


@router.post("/upload-ai")
async def upload_and_parse_report(
    user_id: CurrentUserId,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a PDF lab report. Extract text, send to AI for metric extraction,
    then auto-create a MedicalRecord and HealthEntry items.
    """
    import logging
    from datetime import datetime, timezone

    logger = logging.getLogger("lifeos.report_parser")

    if not file.filename:
        return {"success": False, "error": "No file provided."}

    # --- 1. Save the uploaded file ---
    file_path = await file_service.save_upload_file(file, user_id)

    # --- 2. Extract text from the PDF ---
    extracted_text = ""
    try:
        import fitz  # PyMuPDF

        # file_service.save_upload_file already saved the file; get its absolute path
        full_path = file_service.get_file_path(file_path)
        if not full_path:
            return {"success": False, "error": "Saved file not found on disk."}

        doc = fitz.open(str(full_path))
        for page in doc:
            extracted_text += page.get_text()
        doc.close()
    except ImportError:
        logger.error("pymupdf (fitz) is not installed. Install with: pip install pymupdf")
        return {"success": False, "error": "PDF parsing library not installed. Run: pip install pymupdf"}
    except Exception as e:
        logger.error("Failed to extract text from PDF: %s", e)
        return {"success": False, "error": f"Could not read the PDF: {str(e)}"}

    if not extracted_text.strip():
        return {"success": False, "error": "Could not extract any text from this PDF. It may be a scanned image — only text-based PDFs are supported."}

    # --- 3. Send text to Groq AI for JSON extraction ---
    prompt = (
        f"Extract all health metrics from this medical lab report text. "
        f"Return ONLY a JSON object with metric names as keys and numeric values as values.\n\n"
        f"Report text:\n{extracted_text[:6000]}"
    )
    metrics = await ai_service.generate_json_response("report_parser", prompt)

    if not metrics or "_error" in metrics:
        error_msg = metrics.get("_error") if metrics else "No metrics returned."
        # Still create the record with the raw text
        record = MedicalRecord(
            user_id=user_id,
            title=f"Lab Report - {file.filename}",
            category="Blood Test",
            findings=extracted_text[:2000],
            notes=f"AI parsing failed. Error: {error_msg}",
            file_path=file_path,
        )
        db.add(record)
        await db.flush()
        await db.commit()
        return {
            "success": True,
            "record_id": record.id,
            "metrics_extracted": 0,
            "metrics": {},
            "message": f"Report saved but AI could not extract metrics. (Debug: {error_msg})",
        }

    # --- 4. Create the MedicalRecord ---
    findings_summary = ", ".join(f"{k}: {v}" for k, v in metrics.items())
    record = MedicalRecord(
        user_id=user_id,
        title=f"Lab Report - {file.filename}",
        category="Blood Test",
        findings=findings_summary,
        notes=f"Auto-parsed from uploaded PDF. {len(metrics)} metrics extracted.",
        file_path=file_path,
    )
    db.add(record)
    await db.flush()

    # --- 5. Create HealthEntry items for each metric ---
    from app.models.health_tracker import HealthEntry
    now = datetime.now(timezone.utc)
    today_label = now.strftime("%b")  # e.g. "Jul"
    entries_created = 0

    # Handle blood pressure specially (systolic + diastolic)
    systolic = None
    diastolic = None

    for metric_name, value in metrics.items():
        if not isinstance(value, (int, float)):
            try:
                value = float(value)
            except (ValueError, TypeError):
                continue

        key = metric_name.lower().strip()

        if key in ("systolic", "systolic bp", "systolic blood pressure"):
            systolic = value
            continue
        if key in ("diastolic", "diastolic bp", "diastolic blood pressure"):
            diastolic = value
            continue

        # Find matching category
        category = None
        for pattern, cat in METRIC_CATEGORY_MAP.items():
            if pattern in key:
                category = cat
                break

        if category and category != "blood_pressure":
            entry = HealthEntry(
                user_id=user_id,
                category=category,
                value=value,
                label=today_label,
                recorded_at=now,
            )
            db.add(entry)
            entries_created += 1

    # Create BP entry if both systolic and diastolic found
    if systolic is not None and diastolic is not None:
        bp_entry = HealthEntry(
            user_id=user_id,
            category="blood_pressure",
            value=systolic,
            secondary_value=diastolic,
            label=today_label,
            recorded_at=now,
        )
        db.add(bp_entry)
        entries_created += 1

    await db.flush()
    await db.commit()

    return {
        "success": True,
        "record_id": record.id,
        "metrics_extracted": len(metrics),
        "metrics": metrics,
        "health_entries_created": entries_created,
        "message": f"Successfully parsed {len(metrics)} metrics from your report!",
    }

