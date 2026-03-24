import os
from neo4j import GraphDatabase
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env.local')
load_dotenv(env_path)

NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USER = os.getenv("NEO4J_USER")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")

def init_db():
    if not all([NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD]):
        print("Error: Neo4j credentials missing in .env")
        return

    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    
    constraints = [
        "CREATE CONSTRAINT IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE",
        "CREATE CONSTRAINT IF NOT EXISTS FOR (e:Event) REQUIRE e.id IS UNIQUE",
        "CREATE CONSTRAINT IF NOT EXISTS FOR (s:Skill) REQUIRE s.name IS UNIQUE"
    ]
    
    try:
        with driver.session() as session:
            for query in constraints:
                session.run(query)
                print(f"Executed: {query}")
        print("Database constraints successfully applied to prevent duplicate node concurrency issues.")
    except Exception as e:
        print(f"Failed to apply constraints: {e}")
    finally:
        driver.close()

if __name__ == "__main__":
    init_db()
