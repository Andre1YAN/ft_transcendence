.PHONY: up down restart logs build

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose down
	docker-compose build
	docker-compose up -d

logs:
	docker-compose logs -f

build:
	docker-compose build
