.PHONY: run tidy fmt build start

run:
	go run main.go

tidy:
	go mod tidy

fmt:
	go fmt ./...

build:
	go build -o predictions main.go

start: tidy fmt run