#!/bin/bash

if [ -z $PROJECT_ID ]
then
  echo "You must set PROJECT_ID as an environment variable" 1>&2
  exit 1
fi

gcloud iam service-accounts create apigee-k8s-sa \
    --description="For automation via k8s" \
    --display-name="apigee-k8s-sa"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:apigee-k8s-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/apigee.developerAdmin"

gcloud iam service-accounts keys create service_account.json \
    --iam-account=apigee-k8s-sa@${PROJECT_ID}.iam.gserviceaccount.com


kubectl create ns apigee-config
kubectl -n apigee-config create secret generic serviceaccount --from-file=service_account.json
