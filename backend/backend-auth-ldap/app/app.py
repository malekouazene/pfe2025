from flask import Flask, request, jsonify
from flask_cors import CORS
import ldap3
import os


app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])

@app.before_request
def handle_options():
    if request.method == 'OPTIONS':
        response = app.make_response('')
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response


# LDAP config
LDAP_SERVER = os.environ.get('LDAP_SERVER', 'ldap://127.0.0.1')
LDAP_PORT = int(os.environ.get('LDAP_PORT', 389))
LDAP_BASE_DN = 'dc=mobilis,dc=dz'
LDAP_EMPLOYEES_DN = 'ou=employees,' + LDAP_BASE_DN
LDAP_GROUPS_DN = 'ou=groups,' + LDAP_BASE_DN
LDAP_BIND_DN = 'cn=admin,dc=mobilis,dc=dz'
LDAP_BIND_PASSWORD = 'admin_password'  # assure-toi que c'est bien le mot de passe admin

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Identifiant et mot de passe requis'}), 400

    try:
        server = ldap3.Server(LDAP_SERVER, port=LDAP_PORT)
        print(f"[DEBUG] Tentative de connexion admin à {LDAP_SERVER}:{LDAP_PORT}")
        
        admin_conn = ldap3.Connection(server, LDAP_BIND_DN, LDAP_BIND_PASSWORD, auto_bind=True)
        print(f"[DEBUG] Connexion admin réussie: {admin_conn.bound}")

        # Essayer différents filtres de recherche
        search_filters = [
            f"(cn={username})",
            f"(uid={username})",
            f"(sAMAccountName={username})",
            f"(mail={username})"
        ]
        
        user_found = False
        for search_filter in search_filters:
            print(f"[DEBUG] Recherche avec filtre: {search_filter}")
            admin_conn.search(
                search_base=LDAP_EMPLOYEES_DN,
                search_filter=search_filter,
                attributes=['cn', 'uid', 'givenName', 'sn', 'gidNumber', 'uidNumber']

            )
            
            if admin_conn.entries:
                user_found = True
                print(f"[DEBUG] Utilisateur trouvé avec le filtre: {search_filter}")
                break
                
        if not user_found:
            print(f"[ERREUR] Utilisateur {username} non trouvé dans LDAP")
            return jsonify({'message': 'Utilisateur non trouvé'}), 404

     
        user_entry = admin_conn.entries[0]
        user_dn = user_entry.entry_dn
        user_gid = user_entry.gidNumber.value
     

        print(f"[INFO] DN trouvé pour {username} : {user_dn}")
        print(f"[INFO] GID de l'utilisateur : {user_gid}")

        # Authentifier l'utilisateur avec son DN et mot de passe
        try:
            user_conn = ldap3.Connection(server, user=user_dn, password=password, auto_bind=True)
            print(f"[INFO] Authentification réussie pour {username}")
        except Exception as bind_error:
            print(f"[ERREUR] Détail de l'erreur d'authentification: {str(bind_error)}")
            return jsonify({'message': 'Mot de passe incorrect'}), 401

        # Trouver les rôles via le gidNumber
        admin_conn.search(
            search_base=LDAP_GROUPS_DN,
            search_filter=f"(gidNumber={user_gid})",
            attributes=['cn']
        )
        print(f"[DEBUG] Résultat recherche groupes: {admin_conn.result}")
        
        if not admin_conn.entries:
            print(f"[AVERTISSEMENT] Aucun groupe trouvé pour {username}")
            return jsonify({'message': 'Aucun rôle trouvé pour cet utilisateur'}), 403
            
        roles = [entry.cn.value for entry in admin_conn.entries]
        print(f"[INFO] Rôles de l'utilisateur {username} : {roles}")

        # Retourner le premier rôle (ou plus selon besoin)
        # Retourner toutes les infos utilisateur
        return jsonify({
            'message': 'Authentification réussie',
            'user': {
                'username': user_entry.cn.value,
                'firstName': user_entry.givenName.value if 'givenName' in user_entry else '',
                'lastName': user_entry.sn.value if 'sn' in user_entry else '',
                'uid': user_entry.uid.value if 'uid' in user_entry else '',
                'uidNumber': user_entry.uidNumber.value if 'uidNumber' in user_entry else '',
                'role': roles[0]
            }
        }), 200


    except ldap3.core.exceptions.LDAPBindError as bind_error:
        print(f"[ERREUR] Échec d'authentification pour {username}: {str(bind_error)}")
        return jsonify({'message': 'Identifiant ou mot de passe incorrect'}), 401
    except Exception as e:
        print(f"[ERREUR] Erreur serveur : {str(e)}")
        return jsonify({'message': 'Erreur serveur'}), 500



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




@app.route('/api/admin/add-user', methods=['POST'])
def add_user():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    first_name = data.get('firstName')
    last_name = data.get('lastName')
    role = data.get('role')  # Récupérer le rôle de l'utilisateur

    if not username or not password or not first_name or not last_name or not role:
        return jsonify({'message': 'Nom d\'utilisateur, mot de passe, prénom, nom et rôle requis'}), 400

    try:
        # Connexion à LDAP
        server = ldap3.Server(LDAP_SERVER, port=LDAP_PORT)
        conn = ldap3.Connection(server, LDAP_BIND_DN, LDAP_BIND_PASSWORD, auto_bind=True)
        print(f"[DEBUG] Connexion réussie à {LDAP_SERVER}:{LDAP_PORT}")

        # Créer le DN de l'utilisateur 
        user_dn = f"cn={username},{LDAP_EMPLOYEES_DN}"

        # Créer l'attribut de l'utilisateur dans le format approprié
        user_attributes = {
            'cn': f"{first_name} {last_name}",  # Nom complet
            'givenName': first_name,  # Prénom
            'sn': last_name,  # Nom de famille
            'uid': username,  
            'userPassword': password,  # Mot de passe
            'objectClass': ['top', 'inetOrgPerson', 'posixAccount'],  
            'gidNumber': get_gid_for_role(role),  
            'uidNumber': generate_uid_number(),  
            'homeDirectory': f"/home/users/{username}", 
            'loginShell': '/bin/bash',  
        }

        print(f"[DEBUG] Tentative d'ajout de l'utilisateur avec DN: {user_dn}")

        # Ajouter l'utilisateur dans LDAP
        conn.add(user_dn, attributes=user_attributes)

        # Vérifier si l'ajout a réussi
        if conn.result['description'] != 'success':
            print(f"[ERROR] Erreur lors de l'ajout de l'utilisateur : {conn.result}")
            return jsonify({'message': 'Erreur lors de la création de l\'utilisateur'}), 500
        
        print(f"[INFO] Utilisateur {username} ajouté avec succès dans LDAP.")
        return jsonify({'message': f'Utilisateur {username} créé avec succès'}), 201

    except ldap3.core.exceptions.LDAPBindError as bind_error:
        print(f"[ERROR] Erreur de connexion LDAP : {bind_error}")
        return jsonify({'message': 'Erreur de connexion LDAP'}), 500
    except Exception as e:
        print(f"[ERROR] Erreur générale lors de la création de l'utilisateur : {str(e)}")
        return jsonify({'message': 'Erreur serveur'}), 500

def get_gid_for_role(role):
    """ Fonction pour obtenir le gidNumber en fonction du rôle de l'utilisateur """
    # Définir des gidNumbers pour les différents rôles
    if role == "admin":
        return 500  # Exemple de gid pour admin
    elif role == "user":
        return 502  # Exemple de gid pour un utilisateur standard
    elif role == "expert":
        return 501  # Retourner un rôle par défaut si le rôle n'est pas reconnu

def generate_uid_number():
    # Connexion au serveur LDAP
    server = ldap3.Server(LDAP_SERVER, port=LDAP_PORT)
    conn = ldap3.Connection(server, LDAP_BIND_DN, LDAP_BIND_PASSWORD, auto_bind=True)

    # Recherche de tous les utilisateurs dans l'annuaire sans tri
    conn.search(
        search_base=LDAP_EMPLOYEES_DN,
        search_filter="(objectClass=posixAccount)",  # Chercher tous les utilisateurs de type posixAccount
        attributes=["uidNumber"]
    )

    # Vérifier si des utilisateurs ont été trouvés
    if conn.entries:
        # Trier les résultats par uidNumber et récupérer le plus grand uidNumber
        sorted_entries = sorted(conn.entries, key=lambda entry: int(entry.uidNumber.value))
        max_uid = int(sorted_entries[-1].uidNumber.value)  # Le dernier dans la liste triée
        new_uid = max_uid + 1  # Incrémenter pour générer un nouvel uidNumber
    else:
        # Si aucun utilisateur n'existe, commencer avec 1000
        new_uid = 1000

    return new_uid



@app.route('/api/admin/delete-user/<username>', methods=['DELETE'])
def delete_user(username):
    print(f"[DEBUG] Suppression de l'utilisateur {username} demandée")
    try:
        # Connexion à LDAP
        server = ldap3.Server(LDAP_SERVER, port=LDAP_PORT)
        conn = ldap3.Connection(server, LDAP_BIND_DN, LDAP_BIND_PASSWORD, auto_bind=True)
        print(f"[DEBUG] Connexion réussie à LDAP")
        
        # D'abord, obtenons tous les utilisateurs pour déboguer
        conn.search(
            search_base=LDAP_EMPLOYEES_DN,
            search_filter="(objectClass=person)",
            attributes=['cn', 'uid']
        )
        print(f"[DEBUG] Tous les utilisateurs disponibles: {[entry.entry_dn for entry in conn.entries]}")

        # La recherche doit être plus flexible - plusieurs approches
        # 1. Recherche directe par cn exact
        search_filter = f"(cn={username})"
        conn.search(
            search_base=LDAP_EMPLOYEES_DN,
            search_filter=search_filter,
            attributes=['*']
        )
        
        # 2. Si rien n'est trouvé, essayer de chercher par uid
        if not conn.entries:
            search_filter = f"(uid={username})"
            conn.search(
                search_base=LDAP_EMPLOYEES_DN,
                search_filter=search_filter,
                attributes=['*']
            )
        
        # 3. Si toujours rien, essayer une recherche partielle sur cn ou uid
        if not conn.entries:
            # Extraire seulement le premier mot du nom d'utilisateur (si contient des espaces)
            first_part = username.split(' ')[0]
            search_filter = f"(|(cn=*{first_part}*)(uid=*{first_part}*))"
            
            conn.search(
                search_base=LDAP_EMPLOYEES_DN,
                search_filter=search_filter,
                attributes=['*']
            )
        
        print(f"[DEBUG] Résultats de la recherche LDAP: {conn.entries}")

        if not conn.entries:
            return jsonify({'message': 'Utilisateur non trouvé'}), 404
        
        # Récupération du DN exact
        user_dn = conn.entries[0].entry_dn
        print(f"[DEBUG] DN de l'utilisateur trouvé : {user_dn}")

        # Suppression de l'utilisateur
        conn.delete(user_dn)
        print(f"[DEBUG] Résultat suppression: {conn.result}")

        if conn.result['description'] == 'success':
            return jsonify({'message': f'Utilisateur {username} supprimé avec succès'}), 200
        else:
            print(f"[ERREUR] Échec suppression: {conn.result}")
            return jsonify({'message': 'Erreur lors de la suppression'}), 500
            
    except Exception as e:
        print(f"[ERREUR] Erreur serveur : {str(e)}")
        return jsonify({'message': f'Erreur serveur: {str(e)}'}), 500










@app.route('/api/admin/roles', methods=['GET'])
def get_roles():
    try:
        print(f"[DEBUG] Tentative de connexion à {LDAP_SERVER}:{LDAP_PORT}")
        server = ldap3.Server(LDAP_SERVER, port=LDAP_PORT)
        conn = ldap3.Connection(server, LDAP_BIND_DN, LDAP_BIND_PASSWORD, auto_bind=True)
        print("[DEBUG] Connexion LDAP réussie")

        base_dn = LDAP_GROUPS_DN
        print(f"[DEBUG] Recherche dans : {base_dn}")
        
        conn.search(
            search_base=base_dn,
            search_filter="(objectClass=posixGroup)",
            attributes=['cn', 'gidNumber', 'description']
        )
        print(f"[DEBUG] Résultats trouvés : {len(conn.entries)}")

        if not conn.entries:
            print("[WARNING] Aucun rôle trouvé dans LDAP")
            return jsonify([]), 200

        roles = []
        for entry in conn.entries:
            role = {
                "name": entry.cn.value,
                "gidNumber": entry.gidNumber.value
            }
            if 'description' in entry:
                role["description"] = entry.description.value
            roles.append(role)

        print(f"[DEBUG] Rôles retournés : {roles}")
        return jsonify(roles), 200

    except ldap3.core.exceptions.LDAPBindError as e:
        print(f"[ERREUR] Échec de connexion LDAP : {str(e)}")
        return jsonify({'message': 'Erreur d\'authentification LDAP'}), 500
    except Exception as e:
        print(f"[ERREUR] Erreur serveur : {str(e)}")
        return jsonify({'message': 'Erreur de traitement'}), 500
    








@app.route('/api/admin/delete-role/<role_name>', methods=['DELETE'])
def delete_role(role_name):
    print(f"[DEBUG] Tentative de suppression du rôle: {role_name}")
    try:
        # Connexion à LDAP
        server = ldap3.Server(LDAP_SERVER, port=LDAP_PORT)
        conn = ldap3.Connection(server, LDAP_BIND_DN, LDAP_BIND_PASSWORD, auto_bind=True)
        print("[DEBUG] Connexion LDAP réussie")

        # Construction du DN complet du rôle
        role_dn = f"cn={role_name},{LDAP_GROUPS_DN}"
        print(f"[DEBUG] DN du rôle à supprimer: {role_dn}")

        # Vérification que le rôle existe
        conn.search(
            search_base=role_dn,
            search_filter="(objectClass=posixGroup)",
            attributes=['*']
        )
        
        if not conn.entries:
            print(f"[ERREUR] Rôle {role_name} non trouvé")
            return jsonify({'message': 'Rôle non trouvé'}), 404

        # Suppression du rôle
        conn.delete(role_dn)
        print(f"[DEBUG] Résultat suppression: {conn.result}")

        if conn.result['description'] == 'success':
            print(f"[INFO] Rôle {role_name} supprimé avec succès")
            return jsonify({'message': f'Rôle {role_name} supprimé avec succès'}), 200
        else:
            print(f"[ERREUR] Échec suppression: {conn.result}")
            return jsonify({'message': 'Erreur lors de la suppression du rôle'}), 500

    except ldap3.core.exceptions.LDAPBindError as e:
        print(f"[ERREUR] Échec de connexion LDAP : {str(e)}")
        return jsonify({'message': 'Erreur d\'authentification LDAP'}), 500
    except Exception as e:
        print(f"[ERREUR] Erreur serveur : {str(e)}")
        return jsonify({'message': f'Erreur serveur: {str(e)}'}), 500


  

#pour ajouter role :

@app.route('/api/admin/add-role', methods=['POST'])
def add_role():
    data = request.json
    role_name = data.get('name')
    description = data.get('description', '')
    gid_number = data.get('gidNumber')

    if not role_name:
        return jsonify({'message': 'Nom du rôle requis'}), 400

    try:
        # Connexion LDAP
        server = ldap3.Server(LDAP_SERVER, port=LDAP_PORT)
        conn = ldap3.Connection(server, LDAP_BIND_DN, LDAP_BIND_PASSWORD, auto_bind=True)
        print(f"[DEBUG] Connexion LDAP réussie")

        # Vérifier si le rôle existe déjà
        role_dn = f"cn={role_name},{LDAP_GROUPS_DN}"
        conn.search(role_dn, "(objectClass=posixGroup)")
        if conn.entries:
            return jsonify({'message': 'Ce rôle existe déjà'}), 400

        # Générer un GID si non fourni
        if not gid_number:
            conn.search(
                LDAP_GROUPS_DN, 
                "(objectClass=posixGroup)", 
                attributes=['gidNumber']
            )
            existing_gids = [int(entry.gidNumber.value) for entry in conn.entries]
            gid_number = max(existing_gids) + 1 if existing_gids else 500
            print(f"[DEBUG] GID auto-généré: {gid_number}")

        # Attributs du groupe Posix
        attributes = {
            'cn': role_name,
            'gidNumber': str(gid_number),
            'objectClass': ['top', 'posixGroup']
        }

        # Ajouter la description si fournie
        if description:
            attributes['description'] = description

        print(f"[DEBUG] Tentative de création du rôle: {role_dn}")
        print(f"[DEBUG] Attributs: {attributes}")

        # Création du rôle
        conn.add(role_dn, attributes=attributes)
        
        if conn.result['description'] == 'success':
            print(f"[INFO] Rôle {role_name} créé avec succès")
            return jsonify({
                'message': f'Rôle {role_name} créé avec succès',
                'data': {
                    'name': role_name,
                    'gidNumber': gid_number,
                    'description': description
                }
            }), 201
        else:
            print(f"[ERREUR] Échec création: {conn.result}")
            return jsonify({
                'message': 'Erreur lors de la création du rôle',
                'detail': str(conn.result)
            }), 500

    except ldap3.core.exceptions.LDAPBindError as e:
        print(f"[ERREUR] Connexion LDAP échouée: {str(e)}")
        return jsonify({'message': 'Erreur de connexion LDAP'}), 500
    except Exception as e:
        print(f"[ERREUR] Erreur serveur: {str(e)}")
        return jsonify({'message': 'Erreur serveur'}), 500


# recuper les user :
@app.route('/api/auth/user', methods=['GET'])
def get_user_info():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'message': 'Token manquant ou invalide'}), 401
    
    token = auth_header.split(' ')[1]
    
    try:
        # Ici vous devriez valider le token JWT
        # Pour simplifier, je suppose que vous stockez les infos dans le token
        
        username = "malak"  # À remplacer par la logique réelle de décodage du token
        
        server = ldap3.Server(LDAP_SERVER, port=LDAP_PORT)
        admin_conn = ldap3.Connection(server, LDAP_BIND_DN, LDAP_BIND_PASSWORD, auto_bind=True)
        
        admin_conn.search(
            search_base=LDAP_EMPLOYEES_DN,
            search_filter=f"(cn={username})",
            attributes=['cn', 'givenName', 'sn', 'uid', 'uidNumber', 'gidNumber']
        )
        
        if not admin_conn.entries:
            return jsonify({'message': 'Utilisateur non trouvé'}), 404
            
        user_entry = admin_conn.entries[0]
        
        return jsonify({
            'username': user_entry.cn.value,
            'firstName': user_entry.givenName.value if 'givenName' in user_entry else '',
            'lastName': user_entry.sn.value if 'sn' in user_entry else '',
            'uid': user_entry.uid.value if 'uid' in user_entry else '',
            'uidNumber': user_entry.uidNumber.value if 'uidNumber' in user_entry else '',
            'department': 'Département'  # À remplacer par l'attribut réel
        }), 200
        
    except Exception as e:
        print(f"Erreur: {str(e)}")
        return jsonify({'message': 'Erreur serveur'}), 500
 
if __name__ == '__main__':
    app.run(debug=True)
