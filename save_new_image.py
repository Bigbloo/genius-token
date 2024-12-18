import base64
import requests
from PIL import Image
from io import BytesIO

# URL de l'image du génie
image_url = "https://raw.githubusercontent.com/Bigbloo/genius-token/main/assets/genius.png"

# Télécharger l'image
response = requests.get(image_url)
img = Image.open(BytesIO(response.content))

# Sauvegarder l'image
img.save('assets/genius.png', 'PNG')

print("Image sauvegardée avec succès!")
