from PIL import Image
import os

def update_token_image():
    try:
        # Sauvegarder l'ancienne image comme backup si elle n'existe pas déjà
        if not os.path.exists('assets/genius_backup.png'):
            if os.path.exists('assets/genius.png'):
                Image.open('assets/genius.png').save('assets/genius_backup.png')
        
        # Ouvrir l'image JPG
        original_image = Image.open('assets/Genius.jpg')
        
        # Créer une nouvelle image avec fond transparent
        new_image = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
        
        # Convertir l'image en RGBA si nécessaire
        if original_image.mode != 'RGBA':
            original_image = original_image.convert('RGBA')
        
        # Redimensionner si nécessaire en gardant les proportions
        if original_image.size != (512, 512):
            original_image.thumbnail((512, 512), Image.LANCZOS)
        
        # Calculer la position pour centrer l'image
        x = (512 - original_image.size[0]) // 2
        y = (512 - original_image.size[1]) // 2
        
        # Coller l'image sur le fond transparent
        new_image.paste(original_image, (x, y), original_image)
        
        # Sauvegarder en PNG
        new_image.save('assets/genius.png', 'PNG', optimize=True)
        print("✅ Image mise à jour avec succès!")
        
        # Afficher les informations de l'image
        print(f"Taille de l'image: {new_image.size}")
        print(f"Mode: {new_image.mode}")
        
    except Exception as e:
        print(f"❌ Erreur: {str(e)}")

# Exécuter la fonction
update_token_image()
