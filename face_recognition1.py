import face_recognition
import sys
from io import BytesIO

def recognize_faces(reference_image_blob, captured_image_blob):
    ref_image = face_recognition.load_image_file(BytesIO(reference_image_blob))
    captured_image = face_recognition.load_image_file(BytesIO(captured_image_blob))

    ref_encoding = face_recognition.face_encodings(ref_image)
    captured_encoding = face_recognition.face_encodings(captured_image)

    if len(ref_encoding) == 0 or len(captured_encoding) == 0:
        print("Error: No face detected in one of the images.")
        return

    match = face_recognition.compare_faces([ref_encoding[0]], captured_encoding[0])
    print("Match" if match[0] else "No Match")

if __name__ == "__main__":
    input_data = sys.stdin.buffer.read()
    separator = b"====SEPARATOR===="
    parts = input_data.split(separator)

    if len(parts) != 2:
        print("Error: Incorrect number of images received.")
        sys.exit(1)
    
    reference_image_blob = parts[0]
    captured_image_blob = parts[1]
    recognize_faces(reference_image_blob, captured_image_blob)