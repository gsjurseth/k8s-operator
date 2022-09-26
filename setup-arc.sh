#!/bin/bash

# Update the next line
export PATH=$PATH:/path/to/envoy-adapter/apigee-remote-service-cli

export ORG=%%PRODUCT_ID%%
export RUNTIME=UPDATE_ME
export ENV=dev-prog-proxy
#export NAMESPACE=apigee
export AX_SERVICE_ACCOUNT=%%PRODUCT_ID%%-ax.json
apigee-remote-service-cli provision --organization $ORG --environment $ENV --runtime $RUNTIME --analytics-sa $AX_SERVICE_ACCOUNT --token $(gcloud auth print-access-token) > config.yaml
