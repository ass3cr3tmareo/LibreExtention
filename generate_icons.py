from PIL import Image, ImageDraw, ImageFont
import os

def generate_icon(size):
    # Create a new image with a white background
    image = Image.new('RGB', (size, size), '#4CAF50')
    draw = ImageDraw.Draw(image)
    
    # Try to load a font, fall back to default if not available
    try:
        font = ImageFont.truetype("Arial", int(size * 0.6))
    except:
        font = ImageFont.load_default()
    
    # Draw the text
    text = "LT"
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    
    x = (size - text_width) // 2
    y = (size - text_height) // 2
    
    draw.text((x, y), text, fill='white', font=font)
    
    return image

# Generate icons of different sizes
sizes = [16, 48, 128]
for size in sizes:
    icon = generate_icon(size)
    icon.save(f'icon{size}.png')
    print(f'Generated icon{size}.png') 