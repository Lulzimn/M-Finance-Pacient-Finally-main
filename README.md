# M-Dental Finance — Personalization & DB Setup

## Lockdown Akses (Personalizim)
- Aktivizo mbylljen e aksesit gjatë personalizimit duke vendosur `LOCKDOWN_MODE=true` në `backend/.env`.
- Në këtë modalitet, të gjitha rrugët `/api/*` bllokohen (503) përveç: `/api/auth/session`, `/api/auth/logout`, `/api/auth/me`.
- CORS është i kufizuar për parazgjedhje vetëm te `http://localhost:3000` dhe `http://127.0.0.1:3000`. Përdor `CORS_ORIGINS` në `.env` për t’i shtuar domenet e tua.

## Fshirje e aksesit emergent në frontend
- Visual Edits dhe endpoint-i `/edit-file` janë të ÇAKTËSUARA si “off” për parazgjedhje. Për t’i aktivizuar, vendos `ENABLE_VISUAL_EDITS=true` para nisjes së dev server.
- Endpoint-i `/ping` mund të çaktivizohet duke vendosur `ENABLE_PING=false`.
- CORS në dev-server lejon vetëm `localhost/127.0.0.1` ose një origjinë të vetme të përcaktuar me `ALLOWED_ORIGIN`.

## MySQL Shell — Lidhje DB
- Shembull konfigurimi është në `backend/.env.example` (variablat `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`).
- Skripti i lidhjes MySQL: shiko `backend/mysql_connection.py` për test lidhjeje (`SELECT 1`).
- Instalimet kërkojnë `mysql-connector-python` (shtuar në `backend/requirements.txt`).

### Komanda të shpejta
```bash
# Backend: konfigurim env
cp backend/.env.example backend/.env

# Opsionale: aktivizo lockdown
echo "LOCKDOWN_MODE=true" >> backend/.env

# Backend: instalim paketash
python3 -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt

# Testo lidhjen MySQL
python backend/mysql_connection.py
```

### MySQL Shell (shembull lidhjeje)
```bash
# Hap MySQL Shell dhe lidhu
mysqlsh --sql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p

# Krijo DB nëse mungon
CREATE DATABASE IF NOT EXISTS mdental;
USE mdental;
```

Ky repo është i konfiguruar që akseset publike dhe endpoint-et e shëndetit të jenë të çaktivizuara për parazgjedhje, për ta bërë personalizimin të sigurt.
