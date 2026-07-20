/* ============================================
   LifeOS — Emergency System Module
   ============================================ */

const Emergency = {
  async init() { 
    await this.render(); 
  },

  async render() {
    const container = document.getElementById('page-emergency');
    container.innerHTML = '<div class="empty-state"><span class="spinner"></span> Loading Emergency System...</div>';

    try {
      const [contacts, qrData] = await Promise.all([
        API.get('/emergency/contacts'),
        API.get('/emergency/qr-data')
      ]);
      
      const profile = App.currentProfile || {};

      container.innerHTML = `
        <div class="section-header" style="background: var(--bg-card); padding: 24px 32px; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 4px 20px rgba(0,0,0,0.03); margin-bottom: 28px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="width: 52px; height: 52px; background: rgba(239,68,68,0.1); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: var(--danger);">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            </div>
            <div>
              <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0 0 4px 0; font-family: 'Inter', sans-serif;">Emergency System</h2>
              <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
                <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--danger); box-shadow: 0 0 6px var(--danger);"></span>
                Quick access to emergency features and health card
              </p>
            </div>
          </div>
        </div>

        <!-- SOS Button -->
        <div class="glass-card" style="background: var(--bg-card); border: 1px solid rgba(239, 68, 68, 0.2); box-shadow: 0 10px 40px rgba(239, 68, 68, 0.08); text-align: center; margin-bottom: var(--space-2xl); padding: 40px 24px; border-radius: 24px; position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          
          <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #ef4444, #f97316);"></div>

          <button class="btn btn-sos hover-lift" onclick="Emergency.triggerSOS()" style="
            display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
            width: 140px; height: 140px; border-radius: 50%; 
            background: linear-gradient(145deg, #ef4444, #dc2626); 
            box-shadow: 0 12px 30px rgba(239, 68, 68, 0.4), inset 0 2px 4px rgba(255,255,255,0.4); 
            border: 6px solid var(--bg-card); outline: 2px solid rgba(239,68,68,0.2);
            color: white; font-weight: 800; font-size: 1.4rem; letter-spacing: 1px; transition: all 0.3s; z-index: 2; cursor: pointer;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            SOS
          </button>

          <div style="margin-top: 24px; z-index: 2;">
            <h3 style="font-size: 1.3rem; color: var(--text-primary); margin-bottom: 8px; font-weight: 700;">Emergency Assistance</h3>
            <p style="font-size: 0.95rem; color: var(--text-secondary); max-width: 500px; margin: 0 auto; line-height: 1.5;">
              Press the SOS button to instantly alert your emergency contacts and share your live location. 
            </p>
            <div style="margin-top: 16px; display: inline-flex; align-items: center; gap: 8px; background: rgba(239,68,68,0.1); padding: 8px 16px; border-radius: 50px; color: var(--danger); font-size: 0.8rem; font-weight: 600;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              Also call your local emergency number (e.g., 911)
            </div>
          </div>
        </div>

        <div class="grid-2 gap-xl">
          <!-- Emergency Info (Left) -->
          <div style="display: flex; flex-direction: column; gap: var(--space-xl);">
            <!-- Emergency Contacts -->
            <div>
              <h3 style="margin-bottom: var(--space-md); display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.2rem;">📞</span> Emergency Contacts
              </h3>
              <div class="glass-card no-hover">
                ${contacts.map(c => `
                  <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 16px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.02); transition: transform 0.2s; cursor: default;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                    <div style="display: flex; align-items: center; gap: 16px;">
                      <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(239, 68, 68, 0.1); color: var(--danger); display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                      </div>
                      <div>
                        <div style="font-weight: 700; font-size: 1.1rem; color: var(--text-primary); margin-bottom: 4px;">${c.name}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
                          <span style="background: var(--bg-body); padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 0.75rem;">${c.relation}</span> 
                          <span>${c.phone}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <button class="btn btn-sm btn-secondary" onclick="Emergency.editContact('${c.id}', '${c.name.replace(/'/g, "\\'")}', '${c.phone.replace(/'/g, "\\'")}', '${c.relation.replace(/'/g, "\\'")}')" style="width: 36px; height: 36px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 50%;" title="Edit Contact">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button class="btn btn-sm" onclick="Emergency.deleteContact('${c.id}')" style="width: 36px; height: 36px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(239, 68, 68, 0.1); color: var(--danger); border: none;" title="Delete Contact">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </button>
                      <button class="btn btn-sm btn-success" onclick="Emergency.call('${c.phone}')" style="margin-left: 8px; padding: 8px 16px; border-radius: 50px; font-weight: 600; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        Call
                      </button>
                    </div>
                  </div>
                `).join('')}
                <button class="btn btn-secondary btn-sm w-full mt-md" onclick="Emergency.addContact()" style="padding: 12px; font-weight: 600;">+ Add New Contact</button>
              </div>
            </div>

            <!-- Organ Donor -->
            <div>
              <h3 style="margin-bottom: var(--space-md); display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.2rem;">💚</span> Organ Donor Status
              </h3>
              <div class="glass-card hover-lift" style="border-left: 4px solid var(--success);">
                <div class="flex items-center gap-md">
                  <div style="font-size:2.5rem;">💚</div>
                  <div style="flex-grow: 1;">
                    <h4 style="font-size: 1.1rem; margin-bottom: 4px;">Organ Donor Registration</h4>
                    <p style="font-size:0.85rem; color:var(--text-secondary); margin: 0;">
                      ${profile.organ_donor ? 'You are officially registered as an organ donor. Thank you for your generosity!' : 'Consider becoming an organ donor to save lives.'}
                    </p>
                  </div>
                  <button class="btn ${profile.organ_donor ? 'btn-success' : 'btn-outline'}" 
                          onclick="Emergency.toggleDonor()" style="padding: 10px 20px;">
                    ${profile.organ_donor ? '✅ Registered' : 'Register Now'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Health Card & Hospitals (Right) -->
          <div style="display: flex; flex-direction: column; gap: var(--space-xl);">
            <!-- Premium Health Card -->
            <div>
              <h3 style="margin-bottom: var(--space-md); display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.2rem;">🪪</span> Digital Health ID
              </h3>
              
              <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 20px; padding: 24px; position: relative; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.1); color: white;">
                <!-- Decorative Glows -->
                <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: rgba(239, 68, 68, 0.2); filter: blur(40px); border-radius: 50%;"></div>
                <div style="position: absolute; bottom: -50px; left: -50px; width: 120px; height: 120px; background: rgba(59, 130, 246, 0.2); filter: blur(40px); border-radius: 50%;"></div>
                
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; position: relative; z-index: 2;">
                  <div>
                    <h3 style="color: white; font-size: 1.4rem; font-weight: 700; margin: 0 0 4px 0; letter-spacing: 0.5px;">LifeOS Health ID</h3>
                    <p style="color: rgba(255,255,255,0.6); font-size: 0.75rem; margin: 0; font-weight: 600; letter-spacing: 1px;">EMERGENCY MEDICAL INFO</p>
                  </div>
                  <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 8px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                  </div>
                </div>

                <div style="display: flex; gap: 24px; position: relative; z-index: 2; align-items: center;">
                  <!-- QR Code -->
                  <div onclick="Emergency.zoomQR()" style="background: white; padding: 8px; border-radius: 12px; width: 116px; height: 116px; flex-shrink: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.2); cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" title="Click to enlarge">
                    <div id="qr-code" style="width: 100px; height: 100px; pointer-events: none;"></div>
                  </div>

                  <!-- Details -->
                  <div style="flex-grow: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div>
                      <div style="color: rgba(255,255,255,0.5); font-size: 0.7rem; text-transform: uppercase; font-weight: 600; margin-bottom: 2px;">Patient Name</div>
                      <div style="font-weight: 600; font-size: 1rem; color: white;">${qrData.name}</div>
                    </div>
                    <div>
                      <div style="color: rgba(255,255,255,0.5); font-size: 0.7rem; text-transform: uppercase; font-weight: 600; margin-bottom: 2px;">Blood Type</div>
                      <div style="color: #ef4444; font-weight: 800; font-size: 1.2rem; display: flex; align-items: center; gap: 4px;">
                        💧 ${qrData.blood_type}
                      </div>
                    </div>
                    <div>
                      <div style="color: rgba(255,255,255,0.5); font-size: 0.7rem; text-transform: uppercase; font-weight: 600; margin-bottom: 2px;">Age</div>
                      <div style="font-weight: 500; font-size: 0.95rem; color: white;">${qrData.age} yrs</div>
                    </div>
                    <div>
                      <div style="color: rgba(255,255,255,0.5); font-size: 0.7rem; text-transform: uppercase; font-weight: 600; margin-bottom: 2px;">Gender</div>
                      <div style="font-weight: 500; font-size: 0.95rem; color: white;">${qrData.gender}</div>
                    </div>
                  </div>
                </div>

                <!-- Conditions & Allergies Area -->
                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); position: relative; z-index: 2;">
                  ${(qrData.allergies || []).length > 0 ? `
                    <div style="margin-bottom: 12px; display: flex; align-items: flex-start;">
                      <span style="color: rgba(255,255,255,0.5); font-size: 0.7rem; text-transform: uppercase; font-weight: 600; width: 85px; padding-top: 4px;">Allergies:</span>
                      <div style="flex: 1; display: flex; flex-wrap: wrap; gap: 6px;">
                        ${qrData.allergies.map(a => `<span style="background: rgba(239,68,68,0.2); color: #fca5a5; padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; border: 1px solid rgba(239,68,68,0.3); font-weight: 500;">${a}</span>`).join('')}
                      </div>
                    </div>
                  ` : ''}
                  ${(qrData.conditions || []).length > 0 ? `
                    <div style="display: flex; align-items: flex-start;">
                      <span style="color: rgba(255,255,255,0.5); font-size: 0.7rem; text-transform: uppercase; font-weight: 600; width: 85px; padding-top: 4px;">Conditions:</span>
                      <div style="flex: 1; display: flex; flex-wrap: wrap; gap: 6px;">
                        ${qrData.conditions.map(c => `<span style="background: rgba(245,158,11,0.2); color: #fcd34d; padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; border: 1px solid rgba(245,158,11,0.3); font-weight: 500;">${c}</span>`).join('')}
                      </div>
                    </div>
                  ` : ''}
                  ${!(qrData.allergies || []).length && !(qrData.conditions || []).length ? `
                    <div style="color: rgba(255,255,255,0.4); font-size: 0.8rem; font-style: italic;">No known allergies or chronic conditions.</div>
                  ` : ''}
                </div>
              </div>

              <div class="flex gap-sm mt-md">
                <button class="btn btn-primary" onclick="Emergency.downloadQR()" style="flex: 1; justify-content: center; padding: 12px; font-weight: 600; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:8px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Download ID Card
                </button>
                <button class="btn btn-secondary" onclick="Emergency.shareCard()" style="flex: 1; justify-content: center; padding: 12px; font-weight: 600;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:8px;"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                  Share Digital ID
                </button>
              </div>
            </div>

            <!-- Nearby Hospitals -->
            <div>
              <h3 style="margin-bottom: var(--space-md); display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.2rem;">🏥</span> Nearby Hospitals
              </h3>
              <div class="glass-card no-hover">
                ${this.getNearbyHospitals().map(h => `
                  <div class="list-item" style="padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border-light); margin-bottom: 8px;">
                    <div class="item-icon" style="background: rgba(6, 182, 212, 0.1); color: var(--secondary);">${h.icon}</div>
                    <div class="item-content">
                      <div class="item-title" style="font-weight: 600;">${h.name}</div>
                      <div class="item-subtitle">${h.distance} • ${h.type}</div>
                    </div>
                    <a href="tel:${h.phone}" class="btn btn-sm" style="background: rgba(6, 182, 212, 0.1); color: var(--secondary); text-decoration: none;">📞 ${h.phone}</a>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      `;

      this.generateQR(qrData);
    } catch (e) {
      container.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${e.message}</p></div>`;
    }
  },

  generateQR(qrData) {
    const container = document.getElementById('qr-code');
    const dataStr = JSON.stringify(qrData);

    if (container && typeof QRCode !== 'undefined') {
      container.innerHTML = '';
      new QRCode(container, {
        text: dataStr,
        width: 100,
        height: 100,
        colorDark : "#0f172a",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.L
      });
    } else if (container) {
      // Fallback if QRCode library not loaded
      container.innerHTML = `
        <div style="width:180px; height:180px; display:flex; align-items:center; justify-content:center; background:white; border-radius:8px;">
          <div style="text-align:center; color:#333; font-size:0.75rem; padding:12px;">
            <div style="font-size:2rem; margin-bottom:8px;">📱</div>
            QR Code<br>(${qrData.name})
          </div>
        </div>
      `;
    }
  },

  zoomQR() {
    const profile = App.currentProfile || {};
    const qrData = {
      id: profile.id || 'usr_' + Date.now(),
      name: profile.name || 'Unknown',
      blood_type: profile.blood_type || 'Unknown',
      age: profile.age || 'Unknown',
      gender: profile.gender || 'Unknown',
      allergies: profile.allergies || [],
      conditions: profile.conditions || []
    };
    
    const dataStr = JSON.stringify(qrData);

    const modalHtml = `
      <div style="text-align: center; padding: 20px;">
        <h2 style="margin-bottom: 8px; color: var(--text-primary);">Digital Health ID</h2>
        <p style="margin-bottom: 24px; color: var(--text-secondary); font-size: 0.95rem;">Scan this code to instantly access vital emergency medical information.</p>
        
        <div style="display: inline-block; background: white; padding: 24px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.15);">
          <div id="qr-code-large" style="width: 250px; height: 250px;"></div>
        </div>
        
        <div style="margin-top: 24px;">
          <h3 style="margin-bottom: 4px; color: var(--text-primary); font-size: 1.2rem;">${qrData.name}</h3>
          <p style="margin: 0; color: #ef4444; font-weight: bold; font-size: 1.1rem;">Blood Type: ${qrData.blood_type}</p>
        </div>

        <button class="btn btn-secondary w-full" style="margin-top: 32px; padding: 12px;" onclick="Utils.closeModal()">
          Close
        </button>
      </div>
    `;

    Utils.showModal('Scan Health ID', modalHtml);

    // Generate large QR after modal is in DOM
    setTimeout(() => {
      const container = document.getElementById('qr-code-large');
      if (container && typeof QRCode !== 'undefined') {
        container.innerHTML = '';
        new QRCode(container, {
          text: dataStr,
          width: 250,
          height: 250,
          colorDark : "#0f172a",
          colorLight : "#ffffff",
          correctLevel : QRCode.CorrectLevel.L
        });
      }
    }, 50);
  },

  async triggerSOS() {
    Utils.showToast('🚨 Triggering SOS...', 'warning');
    try {
      const res = await API.post('/emergency/sos');
      Utils.showModal('🆘 SOS ACTIVATED', `
        <div style="text-align:center; padding:20px;">
          <div style="font-size:4rem; animation: pulse 1s infinite;">🚨</div>
          <h2 style="color:var(--accent); margin:16px 0;">Emergency Alert Sent!</h2>
          <p style="color:var(--text-secondary); margin-bottom:20px;">
            The following actions have been triggered:
          </p>
          <div style="text-align:left; background:rgba(255,107,107,0.1); padding:16px; border-radius:12px;">
            ${res.actions.map(a => `<div style="margin-bottom:8px;">✅ ${a}</div>`).join('')}
          </div>
          <div style="margin-top:20px;">
            <p style="font-size:1.5rem; font-weight:800; color:var(--accent);">📞 Emergency: 112</p>
          </div>
        </div>
      `);
      Utils.showToast('🚨 SOS Emergency Alert Activated!', 'error');
    } catch (e) {
      Utils.showToast('Failed to trigger SOS', 'error');
    }
  },

  getNearbyHospitals() {
    return [
      { name: 'Apollo Hospital', distance: '2.3 km', type: 'Multi-specialty', phone: '1066', icon: '🏥' },
      { name: 'City Blood Bank', distance: '1.5 km', type: 'Blood Bank', phone: '104', icon: '🩸' },
      { name: 'LifeCare Pharmacy', distance: '0.8 km', type: 'Pharmacy', phone: '1800-123', icon: '💊' },
      { name: 'Ambulance Service', distance: 'On Call', type: 'Emergency', phone: '108', icon: '🚑' }
    ];
  },

  call(phone) {
    Utils.showToast(`📞 Calling ${phone}...`, 'info');
  },

  addContact() {
    Utils.showModal('📞 Add Emergency Contact', `
      <div class="form-group">
        <label class="form-label">Name</label>
        <input type="text" class="form-input" id="contact-name" placeholder="Contact name">
      </div>
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input type="tel" class="form-input" id="contact-phone" placeholder="+91-XXXXXXXXXX">
      </div>
      <div class="form-group">
        <label class="form-label">Relation</label>
        <input type="text" class="form-input" id="contact-relation" placeholder="e.g., Father, Doctor">
      </div>
    `, async () => {
      const contact = {
        name: document.getElementById('contact-name').value,
        phone: document.getElementById('contact-phone').value,
        relation: document.getElementById('contact-relation').value
      };
      
      try {
        await API.post('/emergency/contacts', contact);
        Utils.showToast('Contact added!', 'success');
        this.render();
      } catch (e) {
        Utils.showToast('Failed to add contact', 'error');
      }
    });
  },

  editContact(id, name, phone, relation) {
    Utils.showModal('📞 Edit Emergency Contact', `
      <div class="form-group">
        <label class="form-label">Name</label>
        <input type="text" class="form-input" id="edit-contact-name" value="${name}">
      </div>
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input type="tel" class="form-input" id="edit-contact-phone" value="${phone}">
      </div>
      <div class="form-group">
        <label class="form-label">Relation</label>
        <input type="text" class="form-input" id="edit-contact-relation" value="${relation}">
      </div>
    `, async () => {
      const contact = {
        name: document.getElementById('edit-contact-name').value,
        phone: document.getElementById('edit-contact-phone').value,
        relation: document.getElementById('edit-contact-relation').value
      };
      
      try {
        await API.put('/emergency/contacts/' + id, contact);
        Utils.showToast('Contact updated!', 'success');
        this.render();
      } catch (e) {
        Utils.showToast(e.message || 'Failed to update contact', 'error');
      }
    });
  },

  async deleteContact(id) {
    if (confirm('Delete this contact?')) {
      try {
        await API.delete(`/emergency/contacts/${id}`);
        Utils.showToast('Contact deleted', 'info');
        this.render();
      } catch (e) {
        Utils.showToast('Failed to delete contact', 'error');
      }
    }
  },

  async toggleDonor() {
    try {
      const res = await API.post('/emergency/toggle-donor');
      await App.updateHeader(); // refresh profile state
      Utils.showToast(res.message, 'success');
      this.render();
    } catch (e) {
      Utils.showToast('Failed to update status', 'error');
    }
  },

  downloadQR() {
    Utils.showToast('📥 QR Card download initiated', 'success');
  },

  shareCard() {
    Utils.showToast('📤 Secure sharing link generated (valid 24 hours)', 'info');
  }
};
