import os
import sys
import httpx
ATLAS_PUBLIC_KEY = os.environ.get("ATLAS_PUBLIC_KEY")
ATLAS_PRIVATE_KEY = os.environ.get("ATLAS_PRIVATE_KEY")
ATLAS_PROJECT_ID = os.environ.get("ATLAS_PROJECT_ID")  # aka groupId

BASE_URL = "https://cloud.mongodb.com/api/atlas/v1.0"


def list_clusters():
    if not ATLAS_PROJECT_ID:
        raise RuntimeError("ATLAS_PROJECT_ID is not set. Add it to .env")
    path = f"/groups/{ATLAS_PROJECT_ID}/clusters"
    url = BASE_URL + path
    if not ATLAS_PUBLIC_KEY or not ATLAS_PRIVATE_KEY:
        raise RuntimeError("Atlas API keys are missing. Set ATLAS_PUBLIC_KEY and ATLAS_PRIVATE_KEY in .env")
    auth = httpx.DigestAuth(ATLAS_PUBLIC_KEY, ATLAS_PRIVATE_KEY)
    with httpx.Client(timeout=20, auth=auth, headers={"Accept": "application/json"}) as client:
        resp = client.get(url)
        resp.raise_for_status()
        return resp.json()


def main():
    try:
        clusters = list_clusters()
        names = [c.get("name") for c in clusters.get("results", [])]
        print({"ok": True, "clusters": names, "total": clusters.get("totalCount")})
    except Exception as e:
        print({"ok": False, "error": str(e)})
        sys.exit(1)


if __name__ == "__main__":
    main()
