import json
import os

try:
    with open('all_steps.json', 'r') as f:
        # Some files have header/separator junk
        lines = f.readlines()
        # Find where the JSON array starts [
        content = "".join(lines)
        start = content.find('[')
        end = content.rfind(']') + 1
        if start != -1 and end != -1:
            json_str = content[start:end]
            # Replace those '+' that look like they are from psql output
            json_str = json_str.replace('+', '')
            data = json.loads(json_str)
            print(f"Total steps: {len(data)}")
            
            # Print unique journey_ids and count
            journeys = {}
            for step in data:
                jid = step.get('journey_id')
                journeys[jid] = journeys.get(jid, 0) + 1
            
            print("\nJourney Counts:")
            for jid, count in journeys.items():
                print(f"{jid}: {count}")
        else:
            print("Could not find JSON array")
except Exception as e:
    print(f"Error: {e}")
