import base64
from PIL import Image
import io
import sys

def save_image(image_path):
    # Créer une nouvelle image avec un fond transparent
    img = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    
    # Charger l'image partagée
    shared_img = Image.open(image_path)
    
    # Redimensionner si nécessaire
    if shared_img.size != (512, 512):
        shared_img = shared_img.resize((512, 512), Image.LANCZOS)
    
    # Sauvegarder l'image
    shared_img.save('assets/genius.png', 'PNG', optimize=True)
    print("Image sauvegardée avec succès!")

# Sauvegarder l'image
save_image('assets/genius.png')
