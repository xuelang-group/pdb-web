REGISTRY="registry.xuelangyun.com"
NAMESPACE="shuzhi"
IMAGE_NAME=$(node -e "console.log(require('./package.json').name)")
IMAGE_URL="${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}"
IMAGE_VERSION=$(node -e "console.log(require('./package.json').version)")

docker build -t ${IMAGE_URL}:${IMAGE_VERSION} . -f ./docker/Dockerfile

docker push ${IMAGE_URL}:${IMAGE_VERSION}