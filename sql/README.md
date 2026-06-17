# SQL Initialization

Run scripts in this order:

```bash
mysql -uroot -p123456 < sql/01_schema.sql
mysql -uroot -p123456 wms_alpha < sql/02_seed_master_data.sql
mysql -uroot -p123456 wms_alpha < sql/03_seed_business_data.sql
```

## Files

- `01_schema.sql`: database and table schema.
- `02_seed_master_data.sql`: users, products, customers, suppliers, warehouses, areas, locations.
- `03_seed_business_data.sql`: inventory, SN, inbound, outbound, interface logs, operation logs, mock config.

## Docker Compose

`docker-compose.yml` mounts this directory to MySQL initdb:

```text
./sql:/docker-entrypoint-initdb.d:ro
```

MySQL executes these scripts only when the data volume is empty.
