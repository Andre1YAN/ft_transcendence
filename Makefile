# Makefile for ft_transcendence

# 默认文件
DC = docker-compose
DC_FILE = -f docker-compose.yml

# 默认目标
.PHONY: build up down restart logs bash clean

build:
	$(DC) $(DC_FILE) build

up:
	$(DC) $(DC_FILE) up -d

down:
	$(DC) $(DC_FILE) down

restart: down up

logs:
	$(DC) $(DC_FILE) logs -f

bash:
	$(DC) $(DC_FILE) exec backend sh

clean:
	$(DC) $(DC_FILE) down -v --remove-orphans
