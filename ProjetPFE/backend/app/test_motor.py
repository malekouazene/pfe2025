import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test_connection():
    uri = "mongodb+srv://sserin312:.HC#JQBhD2z_Bft@cluster0.bsv57a5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    client = AsyncIOMotorClient(uri)

    try:
        # on fait un "ping" à la base admin
        await client.admin.command('ping')
        print("✅ Connexion réussie à MongoDB Atlas avec Motor !")
    except Exception as e:
        print("❌ Connexion échouée :", e)

asyncio.run(test_connection())
