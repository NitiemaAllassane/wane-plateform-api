# Installer Prisma 7 (stable) dans un projet NestJS avec pnpm

Guide récap pour réutiliser sur tes prochains projets Nest.

## 1. Installer Prisma 7 (version stable)

```bash
pnpm add -D prisma@7
pnpm add @prisma/client@7
```

⚠️ Précise bien `@7`. Sans version explicite, pnpm installe la dernière version publiée sur npm — actuellement une release candidate de Prisma 8, pas encore stable.

## 2. Approuver les build scripts si demandé

Si pnpm affiche :

```
[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: esbuild@...
```

Lance :

```bash
pnpm approve-builds
```

Sélectionne les paquets natifs proposés (esbuild, etc.) avec `<espace>` puis valide. C'est un comportement normal de pnpm depuis la v10+ (sécurité contre l'exécution de scripts arbitraires), pas une erreur d'installation.

## 3. Initialiser Prisma avec `pnpm exec` (pas `pnpm dlx`)

```bash
pnpm exec prisma init --datasource-provider postgresql
```

⚠️ **Important** : `pnpm exec` utilise la version installée localement dans le projet (7.x). `pnpm dlx` télécharge et exécute la dernière version publiée sur npm (donc la RC de Prisma 8) et casse tout, même si Prisma 7 est déjà installé en local.

Cette commande crée :
- `prisma/schema.prisma`
- `prisma7.config.ts`
- `.env`

## 4. Installer dotenv

```bash
pnpm add -D dotenv
```

Nécessaire pour que `prisma7.config.ts` puisse charger les variables du fichier `.env`.

## 5. Configurer DATABASE_URL

Dans le fichier `.env` généré :

```
DATABASE_URL="postgresql://UTILISATEUR:MOTDEPASSE@localhost:5432/NOM_DE_LA_BASE"
```

Vérifie l'absence de caractères spéciaux non encodés dans le mot de passe (`@`, `#`, `:`, `/`, `%`...). S'il y en a, encode-les en URL (ex: `@` → `%40`).

## 6. Définir un modèle dans schema.prisma

Ouvre `prisma/schema.prisma` et ajoute tes modèles, par exemple :

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
}
```

⚠️ Prisma 7 utilise le nouveau générateur `prisma-client` (et non plus l'ancien `prisma-client-js`), avec un chemin de sortie personnalisé (`output`) au lieu de générer dans `node_modules`.

## 7. Lancer la première migration

```bash
pnpm exec prisma migrate dev --name init
```

Ça crée la table dans PostgreSQL et génère le dossier `prisma/migrations`.

## 8. Installer l'adapter PostgreSQL

Prisma 7 nécessite un adapter de connexion explicite plutôt qu'une simple `DATABASE_URL` lue automatiquement par le client :

```bash
pnpm add @prisma/adapter-pg pg
```

## 9. Générer le client Prisma

```bash
pnpm exec prisma generate
```

Ça crée le dossier `src/generated/prisma` avec le client typé (au lieu de `@prisma/client` dans `node_modules`).

## 10. Créer le PrismaService (NestJS)

```bash
nest g module prisma
nest g service prisma --no-spec
```

`src/prisma/prisma.service.ts` :

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
    });
    super({ adapter });
  }
}
```

`src/prisma/prisma.module.ts` :

```typescript
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

Importer `PrismaModule` dans `app.module.ts` (tableau `imports`).

## 11. Charger `.env` au runtime de l'application

⚠️ **Important** : `prisma7.config.ts` charge `.env` uniquement pour les commandes **CLI** de Prisma (`migrate`, `generate`...), pas pour l'application Nest elle-même. Sans ça, `process.env.DATABASE_URL` est `undefined` au démarrage de l'app, et l'adapter PostgreSQL plante avec une erreur du type :

```
Error: SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string
```

**Solution** : ajouter en toute première ligne de `src/main.ts` (avant tous les autres imports) :

```typescript
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
```

## 12. Générer un CRUD complet pour un modèle

```bash
nest g resource user
```

- **Transport layer** : choisir **REST API**
- **Generate CRUD entry points?** : répondre **Yes**

Ça crée `src/user/` avec controller, service, module et DTOs, avec des méthodes stubées à connecter à Prisma.

Dans `user.service.ts`, injecter `PrismaService` et remplacer les stubs, par exemple :

```typescript
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({ data: createUserDto });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({ where: { id }, data: updateUserDto });
  }

  remove(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }
}
```

⚠️ Les méthodes Prisma (`create`, `update`, `delete`, `findUnique`...) attendent toujours un objet avec des clés précises (`data`, `where`...) — ne jamais leur passer le DTO directement.

---

## Points clés à retenir

- **`pnpm exec` vs `pnpm dlx`** : `exec` utilise la version locale du projet, `dlx` télécharge toujours la dernière version publiée sur npm. Pour Prisma, toujours utiliser `pnpm exec` une fois le paquet installé en local.
- **Versionner explicitement** (`@7`) tant que Prisma 8 n'est pas sorti en version stable (release générale attendue en octobre 2026).
- **`pnpm approve-builds`** est une étape de sécurité normale depuis pnpm v10+, pas un signe de problème d'installation.
- **Prisma 7 change le générateur** : `prisma-client` avec `output` personnalisé remplace `prisma-client-js` (qui générait dans `node_modules`).
- **Adapter de connexion obligatoire** : `@prisma/adapter-pg` (PostgreSQL) doit être passé explicitement au constructeur du `PrismaClient`, la `DATABASE_URL` n'est plus lue automatiquement par le client lui-même.
- **`import 'dotenv/config'` dans `main.ts`** : indispensable pour que `DATABASE_URL` soit chargée au runtime de l'app (le `.env` chargé par `prisma7.config.ts` ne sert qu'à la CLI Prisma).
- **`nest g resource <nom>`** génère un CRUD complet stubé ; toujours envelopper les données dans `{ data: ... }` / `{ where: ... }` pour les appels Prisma.