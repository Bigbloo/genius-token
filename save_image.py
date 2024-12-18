from PIL import Image
import requests
from io import BytesIO
import os

# Create assets directory if it doesn't exist
if not os.path.exists('assets'):
    os.makedirs('assets')

# Save the image
image_path = os.path.join('assets', 'genius.png')
img = Image.new('RGBA', (800, 800), (135, 206, 235, 0))  # Light blue background
img.save(image_path, 'PNG')

print(f'Image saved to {image_path}')
