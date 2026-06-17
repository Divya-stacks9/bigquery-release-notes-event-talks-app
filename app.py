import urllib.request
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
from flask import Flask, render_template, jsonify
import sys

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_feed():
    req = urllib.request.Request(FEED_URL, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    with urllib.request.urlopen(req, timeout=10) as response:
        xml_data = response.read()
    
    root = ET.fromstring(xml_data)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    entries = root.findall('atom:entry', ns)
    
    parsed_updates = []
    
    # We will generate a unique ID for each granular update
    update_counter = 0
    
    for entry in entries:
        date_str = entry.find('atom:title', ns).text.strip()
        
        # Link to the main release note page
        link_el = entry.find('atom:link', ns)
        link_href = link_el.attrib.get('href', '') if link_el is not None else ''
        
        content_el = entry.find('atom:content', ns)
        content_html = content_el.text if content_el is not None else ''
        
        # Parse the HTML content to break down updates by <h3> tags
        soup = BeautifulSoup(content_html, 'html.parser')
        
        current_type = None
        current_elements = []
        
        def save_current():
            nonlocal current_type, current_elements, update_counter
            if current_type is None:
                return
            
            # Reconstruct HTML string
            html_parts = []
            for el in current_elements:
                html_parts.append(str(el))
            html_str = "".join(html_parts).strip()
            
            # Resolve relative URLs
            temp_soup = BeautifulSoup(html_str, 'html.parser')
            for a in temp_soup.find_all('a', href=True):
                if a['href'].startswith('/'):
                    a['href'] = 'https://cloud.google.com' + a['href']
                # Make sure all links open in a new tab
                a['target'] = '_blank'
                a['rel'] = 'noopener noreferrer'
            
            html_str = str(temp_soup)
            text_str = temp_soup.get_text().strip()
            
            # Use specific type names or map to common ones
            normalized_type = current_type.strip()
            
            update_counter += 1
            parsed_updates.append({
                'id': f"update-{update_counter}",
                'date': date_str,
                'type': normalized_type,
                'html': html_str,
                'text': text_str,
                'link': link_href
            })
            
        for child in soup.contents:
            if child.name == 'h3':
                save_current()
                current_type = child.get_text().strip()
                current_elements = []
            else:
                if current_type is None:
                    current_type = "Announcement"  # Fallback
                current_elements.append(child)
                
        save_current()
        
    return parsed_updates

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/updates')
def get_updates():
    try:
        updates = fetch_and_parse_feed()
        return jsonify({
            'success': True,
            'updates': updates,
            'count': len(updates)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Running on local port 5000
    app.run(debug=True, port=5000)
