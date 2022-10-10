# k8s-operator
A simple metacontroller enabled k8s operator for handling apigee specifc entities

## 1) Update PROJECT_ID
First thing we need to do is update the `PROJECT_ID` in all underlying scripts and 
specs.

Run this:

```bash
for a in $(fgrep -lR '%%PROJECT_ID%%' *) ; do  sed -i -e "s/%%PROJECT_ID%%/your-project-name/g" ; done
```

Where `your-project-name` is the ID of your project.

## 2) metacontroller
This simple operator relies on metacontroller. So we need to get metacontroller installed
and that requires an admin-binidng for the cluster in question. 
1. Open up the `install-metacontroller.sh`
script and update `%%CLUSTER_NAME%%` with the name of your cluster.
1. Also update the account (email) of the user for the role binding.

## 3) Create a service account
You'll need to create a service account and key. Download the key to the root of this
repo (where you cloned it) and name it: `service_account.json`.

This service account will need permissions (potentially a role if you create one) with rights
for creating/deleting apiproducts, and developer apps.

## 4) Run the setup script for the service-account
This will use the service account key file and add it as a secret to the `apigee-config` namespace. This will
then be available for use by the operator.

```bash
./setup-sa.sh
```

## 5) Build the code for the controller
The first command you ran should have set this up so it's ready for your project. Let's build it and make it available

```bash
cd src
./buildit.sh
```

That will build the docker, and make it availble on Google container registry. We need it there so that the next step can fetch it when executing the controller

## 6) Now let's setup the controller
The operator is now ready to run. Let's add it

```bash
kubectl apply -f controllers
```


# Using it
You'll find two examples here:

1. product.yaml
1. app.yaml

Have a look at the `product` file and you'll find it an expected representation of an API Product. The `app` likewise is an expected app.

## Create them
The product assumes the developer is already extant.  You'll need to update the `product.yaml` with a developer account that exists. My guess is that if someone is going to use this in a real world scenario it will be with a system developer.

```bash
kubectl apply -f product.yaml
kubectl apply -f app.yaml
```

This will create the artifacts in the project. Now let's fetch the credentials:

```bash
kubectl get developerapps
```

You'll note that you even get back the consumer key which you can use for apikey authentication.

| NAME | AGE | CONSUMERKEY |
| ----| --- | ------- |
| offersapp | 13d | secret-key |
