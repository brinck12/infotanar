# Judge0 telepítése (kódfuttató)

A kódfuttatás a Judge0 CE-n megy; a böngésző sosem éri el, csak a backend. Minden port
a szerver `127.0.0.1` címére van kötve.

## Telepítés

```bash
sudo mkdir -p /opt/judge0 && sudo cp docker-compose.yml judge0.conf.example /opt/judge0/
cd /opt/judge0
sudo cp judge0.conf.example judge0.conf && sudo chmod 600 judge0.conf
sudoedit judge0.conf          # jelszavak, AUTHN_TOKEN, COUNT
sudo docker compose up -d
curl -H "X-Auth-Token: <token>" http://127.0.0.1:2358/about
```

A backend `.env`-jébe: `JUDGE0_URL=http://127.0.0.1:2358`, `JUDGE0_AUTH_TOKEN=<ugyanaz a token>`.

## Kapacitás hangolása

- `COUNT`: egyszerre futó beadások száma a Judge0-n; legyen kevesebb, mint a CPU-magok száma.
- `MAX_QUEUE_SIZE`: a várakozó sor határa; ennél többet a Judge0 nem fogad el.
- A backend saját párhuzamossági korlátja: `JUDGE0_MAX_CONCURRENT` (alap 20). Nagyjából
  `COUNT` és a megengedett sorhossz összege legyen, de legfeljebb a futtatásokra szánt php-fpm
  pool `pm.max_children` értéke (lásd `deploy/php-fpm/pool.conf`). Fölötte a felhasználó gyors
  "Most sokan futtatnak kódot" üzenetet kap (503), nem várakozik.
- A `/ready` végpont figyelmeztet, ha a Judge0 sora `JUDGE0_QUEUE_WARN_DEPTH` fölé nő
  (a `/workers` végpontból; ha a példány nem adja, a mérés kimarad).
- A `judge0.conf` felső határai (`MAX_*`) legyenek nagyobbak vagy egyenlők a backend
  `JUDGE0_MAX_*` értékeivel, különben a Judge0 elutasítja a kérést.
- A valódi számokat terhelésteszttel (REL-8) kell megállapítani.
- A korlát a cache zárjaival működik: több szerver esetén közös cache (Redis, OPS-9) kell.

## Frissítés és naplók

```bash
sudo docker compose pull && sudo docker compose up -d
sudo docker compose logs -f --tail=100 workers
```
