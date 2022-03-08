include ../common/ci/Makefile-lambda

build:
	cd serverless && \
		npm install --no-progress && \
		SLS_DEBUG=* $(SLS_PATH) package --stage ${APP_ENVIRONMENT}

test: default_test

deploy: default_deploy
