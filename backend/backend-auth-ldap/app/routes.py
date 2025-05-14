from flask import Flask, request, jsonify
import ldap3
import os

app = Flask(__name__)

# LDAP configuration
LDAP_SERVER = os.environ.get('LDAP_SERVER', 'ldap://127.0.0.1')
LDAP_PORT = int(os.environ.get('LDAP_PORT', 389))
LDAP_BASE_DN = 'dc=mobilis,dc=dz'
LDAP_EMPLOYEES_DN = 'ou=employees,' + LDAP_BASE_DN
LDAP_GROUPS_DN = 'ou=groups,' + LDAP_BASE_DN
LDAP_BIND_DN = 'cn=admin,dc=mobilis,dc=dz'
LDAP_BIND_PASSWORD = 'admin_password'  # assure-toi que c'est bien le mot de passe admin

@app.route('/api/admin/users', methods=['GET'])
def get_users():
    try:
        # Connexion à LDAP en utilisant les paramètres définis
        server = ldap3.Server(LDAP_SERVER, port=LDAP_PORT)
        conn = ldap3.Connection(server, LDAP_BIND_DN, LDAP_BIND_PASSWORD, auto_bind=True)

        # Recherche des utilisateurs dans l'annuaire LDAP
        conn.search(LDAP_EMPLOYEES_DN, "(objectClass=person)", attributes=["cn", "gidNumber"])

        # Liste des utilisateurs avec leurs rôles
        users = []
        for entry in conn.entries:
            username = entry.cn.value
            gid = entry.gidNumber.value

            # Recherche des rôles des utilisateurs dans le groupe LDAP basé sur gidNumber
            conn.search(LDAP_GROUPS_DN, f"(gidNumber={gid})", attributes=["cn"])
            roles = [entry.cn.value for entry in conn.entries]
            
            # Ajouter l'utilisateur et ses rôles à la liste
            users.append({
                "username": username,
                "roles": roles
            })

        # Retourner la liste des utilisateurs et leurs rôles
        return jsonify(users), 200

    except Exception as e:
        print(f"[ERREUR] Échec de la récupération des utilisateurs : {str(e)}")
        return jsonify({'message': 'Erreur serveur'}), 500

if __name__ == '__main__':
    app.run(debug=True)
