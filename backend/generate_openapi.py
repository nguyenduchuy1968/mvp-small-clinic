"""Generate OpenAPI spec from the FastAPI app."""

import json
import sys

try:
    from app.main import app
    from fastapi.testclient import TestClient

    client = TestClient(app)
    response = client.get("/api/v1/openapi.json")
    data = response.json()

    schemas = data.get("components", {}).get("schemas", {})
    for name, schema in schemas.items():
        if "Appointment" in name:
            props = list(schema.get("properties", {}).keys())
            print(f"{name}: {props}")

    with open("../frontend/openapi.json", "w") as f:
        json.dump(data, f, indent=2)
    print("Saved openapi.json successfully")
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
