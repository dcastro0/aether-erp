docker-up:
	docker compose up -d

docker-down:
	docker compose down

dev-backend:
	cd backend && air

dev-frontend:
	cd frontend && npm run dev

create-migration:
	migrate create -ext sql -dir backend/migrations -seq $(name)

migrate-up:
	migrate -path backend/migrations -database "postgres://aether:aetherpassword@127.0.0.1:5432/aether_core?sslmode=disable" up

sqlc:
	cd backend && sqlc generate