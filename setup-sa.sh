#!/bin/bash

PROJECT_ID=%%PROJECT_ID%%

#gcloud iam service-accounts create apigee-k8s-sa \
#    --description="For automation via k8s" \
#    --display-name="apigee-k8s-sa"

#gcloud projects add-iam-policy-binding $PROJECT_ID \
#    --member="serviceAccount:apigee-k8s-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
#    --role="roles/apigee.developerAdmin"

gcloud iam service-accounts keys create service_account.json \
    --iam-account=apigee-k8s-sa@${PROJECT_ID}.iam.gserviceaccount.com


kubectl create ns apigee-config
kubectl -n apigee-config create secret generic serviceaccount --from-file=service_account.json
