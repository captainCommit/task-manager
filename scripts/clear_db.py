import os

import cloudinary
from cloudinary import api
from dotenv import load_dotenv
from pymongo import MongoClient

config = load_dotenv("../process.env")
cloudinary.config(cloud_name = os.getenv('CLOUD_NAME'), api_key=os.getenv('API_KEY'), api_secret=os.getenv('API_SECRET'))
#print(os.getenv('MONGODB'))
client  = MongoClient(os.getenv('MONGODB'))
current_database = client.list_database_names()[0]
mydb = client[current_database]
#print(mydb)
collections = mydb.list_collection_names()
collections.remove("users")
for collection in collections:
    mydb[collection].drop()
    print('{c} has been dropped'.format(c = collection))
#result = api.delete_resources([],prefix = "review/")
#print("Image cloud cleaned")
print("Done")


