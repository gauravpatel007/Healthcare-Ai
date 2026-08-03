import urllib.request
import json
import traceback

def test_add():
    try:
        data = json.dumps({
            'title': 'Test Add',
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
            result = json.loads(response.read().decode('utf-8'))
            return result
    except Exception as e:
        return str(e)

def test_edit(article_id):
    try:
        data = json.dumps({
            'title': 'Test Edit',
            'content': 'Test Content Edited',
            'category': 'Blogs',
            'status': 'Published',
            'featured_image_url': '',
            'seo_title': '',
            'seo_description': ''
        }).encode('utf-8')
        
        req = urllib.request.Request(
            f'http://127.0.0.1:8000/api/v1/admin/articles/{article_id}',
            data=data,
            headers={'Content-Type': 'application/json'},
            method='PUT'
        )
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result
    except Exception as e:
        if hasattr(e, 'read'):
            return str(e) + " - " + e.read().decode('utf-8')
        return str(e)

if __name__ == "__main__":
    added = test_add()
    with open('test_out2.txt', 'w') as f:
        f.write("ADD RESULT: " + str(added) + "\n")
        if isinstance(added, dict) and 'id' in added:
            edited = test_edit(added['id'])
            f.write("EDIT RESULT: " + str(edited) + "\n")
