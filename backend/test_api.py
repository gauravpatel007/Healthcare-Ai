import urllib.request
import json
import traceback

try:
    data = json.dumps({
        'title': 'Test Title',
        'content': 'Test Content',
        'category': 'Blogs',
        'status': 'Draft',
        'featured_image_url': '',
        'seo_title': '',
        'seo_description': ''
    }).encode('utf-8')
    
    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/v1/admin/articles',
        data=data,
        headers={'Content-Type': 'application/json'}
    )
    
    with urllib.request.urlopen(req) as response:
        result = response.read().decode('utf-8')
        with open('test_out.txt', 'w') as f:
            f.write("SUCCESS: " + result)
except urllib.error.HTTPError as e:
    error_body = e.read().decode('utf-8')
    with open('test_out.txt', 'w') as f:
        f.write(f"HTTP ERROR: {e.code} - {error_body}")
except Exception as e:
    with open('test_out.txt', 'w') as f:
        f.write("OTHER ERROR: " + traceback.format_exc())
