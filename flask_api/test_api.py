"""
Test script for Flask API
"""

import requests
import json
import time

API_URL = 'http://localhost:5000/detect-sarcasm'
HEALTH_URL = 'http://localhost:5000/health'

def test_health():
    """Test health endpoint"""
    print("Testing health endpoint...")
    try:
        response = requests.get(HEALTH_URL, timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_detection():
    """Test sarcasm detection endpoint"""
    test_cases = [
        "Oh great, another wonderful meeting!",
        "Sure, that sounds like a perfect idea!",
        "I love waiting in long lines.",
        "This is a normal tweet about the weather.",
        "Obviously, this is the best solution ever!"
    ]
    
    print("\n" + "="*50)
    print("Testing Sarcasm Detection API")
    print("="*50 + "\n")
    
    for i, text in enumerate(test_cases, 1):
        try:
            print(f"Test {i}: {text[:50]}...")
            response = requests.post(
                API_URL,
                json={'text': text},
                timeout=5
            )
            
            if response.status_code == 200:
                result = response.json()
                status = "[SARCASM]" if result['is_sarcasm'] else "[NOT SARCASM]"
                print(f"  Result: {status} (Confidence: {result['confidence']*100:.1f}%)")
            else:
                print(f"  Error: Status {response.status_code}")
                print(f"  Response: {response.text}")
            print()
            
        except requests.exceptions.ConnectionError:
            print("  [ERROR] Connection failed - Is the server running?")
            print("  Run: python app.py")
            return False
        except Exception as e:
            print(f"  [ERROR] {e}")
            print()
    
    return True

if __name__ == '__main__':
    print("Waiting for server to start...")
    time.sleep(2)
    
    # Test health endpoint
    if not test_health():
        print("\n❌ Server is not running. Please start it with: python app.py")
        exit(1)
    
    # Test detection endpoint
    test_detection()
    
    print("="*50)
    print("Test completed!")

