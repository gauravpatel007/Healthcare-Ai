import os
import glob
import shutil

artifact_dir = r"C:\Users\Gaurav Patel\.gemini\antigravity-ide\brain\4038c299-9dae-4ba4-bd17-02081e4e8f05"
dest_dir = r"g:\Languages\Projects\Healthcare AI\R1\backend\uploads\meals"

if not os.path.exists(dest_dir):
    os.makedirs(dest_dir)

meals = [
    "vegetable_upma",
    "moong_dal_chilla",
    "avocado_toast",
    "idli_sambar",
    "pb_banana_toast",
    "sprouts_salad",
    "chole_brown_rice",
    "rajma_brown_rice",
    "paneer_veg_curry",
    "grilled_fish_rice",
    "chickpea_salad",
    "roti_dal_sabzi",
    "tofu_stir_fry"
]

for meal in meals:
    files = glob.glob(os.path.join(artifact_dir, f"{meal}_*.png"))
    if files:
        src = files[0]
        dest = os.path.join(dest_dir, f"{meal}.png")
        shutil.copy2(src, dest)
        print(f"Copied {meal}")
    else:
        print(f"Missing {meal}")

print("Done copying meals.")
