#!/bin/bash

IMAGE="bargrids"
docker run -it --rm \
  --expose 8080 \
  -p 8080:8080 \
  -v "$(pwd)":/app \
  "${IMAGE}"
