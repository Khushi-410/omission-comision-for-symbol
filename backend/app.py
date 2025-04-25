from flask import Flask, request, jsonify, send_file
from ultralytics import YOLO
import cv2
import numpy as np
import os
from collections import defaultdict
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load YOLO model
model = YOLO("best.pt")

# Colors for different types of detections
COLORS = {
    'original': (0, 255, 0),  # Green for original correct symbols
    'missing': (0, 0, 255),   # Red for missing symbols
    'extra': (255, 0, 0),     # Blue for extra symbols
    'replaced': (128, 0, 128) # Yellow for replaced symbols
}

def detect_symbols(image_path):
    results = model.predict(source=image_path, conf=0.25)
    detections = []
    for result in results:
        for box in result.boxes:
            cls = int(box.cls[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            label = model.names[cls]
            center = ((x1 + x2) // 2, (y1 + y2) // 2)
            detections.append({
                'label': label,
                'bbox': [x1, y1, x2, y2],
                'center': center
            })
    return detections

def count_symbols(detections):
    counter = defaultdict(int)
    for d in detections:
        counter[d['label']] += 1
    return dict(counter)

def find_replacements(original, error, threshold=30):
    replacements = []
    used = set()
    
    for o in original:
        ox, oy = o['center']
        closest = None
        min_dist = float('inf')

        for i, e in enumerate(error):
            if i in used:
                continue
            ex, ey = e['center']
            dist = np.sqrt((ox - ex)**2 + (oy - ey)**2)

            if dist < min_dist and dist < threshold:
                min_dist = dist
                closest = (i, e)

        if closest and o['label'] != closest[1]['label']:
            replacements.append({
                'from': o['label'],
                'to': closest[1]['label'],
                'original_center': o['center'],
                'error_center': closest[1]['center'],
                'original_bbox': o['bbox'],
                'error_bbox': closest[1]['bbox']
            })
            used.add(closest[0])
    return replacements

def draw_detections(image, detections, color, thickness=1):
    for det in detections:
        x1, y1, x2, y2 = det['bbox']
        cv2.rectangle(image, (x1, y1), (x2, y2), color, thickness)
        cv2.putText(image, det['label'], (x1, y1-10), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, thickness=2)
    return image

def generate_separate_images(original_path, error_path, original_detections, error_detections, replacements):
    # Load images
    original_img = cv2.imread(original_path)
    error_img = cv2.imread(error_path)
    
    # Make copies for drawing
    original_visual = original_img.copy()
    error_visual = error_img.copy()
    
    # Draw original correct detections (green)
    original_visual = draw_detections(original_visual, original_detections, COLORS['original'])
    
    # Get centers of replaced detections to exclude them from green drawing
    replaced_error_centers = {tuple(rep['error_center']) for rep in replacements}

    # Filter out replaced detections before drawing green boxes
    filtered_error_detections = [
        det for det in error_detections if tuple(det['center']) not in replaced_error_centers
    ]

    # Now draw only non-replaced detections in green
    error_visual = draw_detections(error_visual, filtered_error_detections, COLORS['original'])

    # Prepare data for visual differences
    missing_in_error = []
    extra_in_error = []
    
    # Find missing symbols (present in original but not in error)
    for o in original_detections:
        found = False
        for e in error_detections:
            dist = np.sqrt((o['center'][0] - e['center'][0])**2 + (o['center'][1] - e['center'][1])**2)
            if dist < 30:
                found = True
                break
        if not found:
            missing_in_error.append(o)
    
    # Find extra symbols (present in error but not in original)
    for e in error_detections:
        found = False
        for o in original_detections:
            dist = np.sqrt((o['center'][0] - e['center'][0])**2 + (o['center'][1] - e['center'][1])**2)
            if dist < 30:
                found = True
                break
        if not found:
            extra_in_error.append(e)
    
    # Draw missing symbols (red) on the ERROR image
    error_visual = draw_detections(error_visual, missing_in_error, COLORS['missing'], 2)

    # Draw extra symbols (blue) on the ERROR image
    error_visual = draw_detections(error_visual, extra_in_error, COLORS['extra'], 1)

    # Draw replacements (yellow) on the ERROR image
    for rep in replacements:
        x1, y1, x2, y2 = rep['error_bbox']
        cv2.rectangle(error_visual, (x1, y1), (x2, y2), COLORS['replaced'], 2)
        cv2.putText(error_visual, f"{rep['from']}->{rep['to']}", (x1, y1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX, 0.5, COLORS['replaced'], 2)
    
    # Convert to bytes
    _, original_encoded = cv2.imencode('.jpg', original_visual)
    _, error_encoded = cv2.imencode('.jpg', error_visual)
    
    return original_encoded.tobytes(), error_encoded.tobytes()

@app.route('/compare', methods=['POST'])
def compare_images():
    if 'original' not in request.files or 'error' not in request.files:
        return jsonify({'error': 'Both original and error images are required'}), 400

    original_file = request.files['original']
    error_file = request.files['error']

    original_path = os.path.join(UPLOAD_FOLDER, 'original.jpg')
    error_path = os.path.join(UPLOAD_FOLDER, 'error.jpg')

    original_file.save(original_path)
    error_file.save(error_path)

    # Detect symbols
    original_detections = detect_symbols(original_path)
    error_detections = detect_symbols(error_path)

    # Count symbols
    original_counts = count_symbols(original_detections)
    error_counts = count_symbols(error_detections)

    # Differences
    all_labels = set(original_counts.keys()) | set(error_counts.keys())
    differences = []

    for label in all_labels:
        count_original = original_counts.get(label, 0)
        count_error = error_counts.get(label, 0)
        if count_original != count_error:
            differences.append({
                'label': label,
                'original': count_original,
                'error': count_error,
                'difference': count_error - count_original
            })

    # Replacements (mismatched but nearby symbols)
    replacements = find_replacements(original_detections, error_detections)

    # Generate separate images
    reference_image, measured_image = generate_separate_images(
        original_path, error_path, 
        original_detections, error_detections, 
        replacements
    )

    return jsonify({
        'original_counts': original_counts,
        'error_counts': error_counts,
        'differences': differences,
        'replacements': replacements,
        'reference_image': reference_image.hex(),  # Send as hex string
        'measured_image': measured_image.hex()    # Send as hex string
    })

if __name__ == '__main__':
    app.run(debug=True)