from PIL import Image
import os

def convert_image():
    try:
        # Ouvrir l'image source
        input_path = 'assets/Genius.jpg'
        output_path = 'assets/genius.png'
        backup_path = 'assets/genius_backup.png'
        
        # Faire une sauvegarde si elle n'existe pas déjà
        if os.path.exists(output_path) and not os.path.exists(backup_path):
            os.rename(output_path, backup_path)
        
        # Ouvrir l'image
        image = Image.open(input_path)
        
        # Convertir en RGBA
        if image.mode != 'RGBA':
            image = image.convert('RGBA')
        
        # Redimensionner à 512x512 en préservant les proportions
        target_size = (512, 512)
        
        # Créer une nouvelle image avec fond transparent
        new_image = Image.new('RGBA', target_size, (0, 0, 0, 0))
        
        # Calculer la nouvelle taille en préservant les proportions
        ratio = min(target_size[0] / image.size[0], target_size[1] / image.size[1])
        new_size = tuple(int(dim * ratio) for dim in image.size)
        
        # Redimensionner l'image
        image = image.resize(new_size, Image.Resampling.LANCZOS)
        
        # Calculer la position pour centrer l'image
        position = tuple((target_size[i] - new_size[i]) // 2 for i in range(2))
        
        # Coller l'image redimensionnée sur le fond transparent
        new_image.paste(image, position, image)
        
        # Optimiser et sauvegarder
        new_image.save(output_path, 'PNG', optimize=True, quality=95)
        
        print(f"✅ Image convertie avec succès!")
        print(f"Taille finale: {new_image.size}")
        print(f"Mode: {new_image.mode}")
        print(f"Sauvegardée dans: {output_path}")
        
    except Exception as e:
        print(f"❌ Erreur lors de la conversion: {str(e)}")

if __name__ == '__main__':
    convert_image()
