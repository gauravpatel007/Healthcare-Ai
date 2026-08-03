import os
import glob
import shutil

artifact_dir = r"C:\Users\Gaurav Patel\.gemini\antigravity-ide\brain\4038c299-9dae-4ba4-bd17-02081e4e8f05"
dest_dir = r"g:\Languages\Projects\Healthcare AI\R1\backend\uploads\meals"

if not os.path.exists(dest_dir):
    os.makedirs(dest_dir)

meals = [
    "oatmeal_fruits",
    "egg_white_omelette",
    "greek_yogurt_bowl",
    "poha_vegetables",
    "grilled_chicken_salad",
    "dal_rice_veggies",
    "quinoa_buddha_bowl",
    "handful_almonds",
    "banana_protein_shake",
    "grilled_fish_veggies",
    "paneer_tikka_roti",
    "soup_multigrain_toast"
]

for meal in meals:
    files = glob.glob(os.path.join(artifact_dir, f"{meal}_*.png"))
    if files:
        src = files[0]
        dest = os.path.join(dest_dir, f"{meal}.png")
        shutil.copy2(src, dest)
        print(f"Copied {meal}")

print("Done copying meals.")
