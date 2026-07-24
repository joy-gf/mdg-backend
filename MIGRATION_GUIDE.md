# Guía de Migraciones - Agregar CI a Pacientes y Actualizar Psicólogos

## Migraciones Creadas

### 1. AddCIToPacientes
- **Archivo**: `src/migrations/AddCIToPacientes.ts`
- **Propósito**: Agregar columna `ci` (Cédula de Identidad) a la tabla `pacientes`
- **Cambios**:
  - Agrega columna `ci VARCHAR(20) UNIQUE NOT NULL`
  - Asigna CIs temporales a registros existentes
  - Crea índice único para optimizar búsquedas

### 2. UpdatePsicologoConstraints
- **Archivo**: `src/migrations/UpdatePsicologoConstraints.ts`
- **Propósito**: Hacer CI y matrícula profesional obligatorios y únicos
- **Cambios**:
  - Hace `ci` NOT NULL y UNIQUE
  - Hace `matricula_profesional` NOT NULL y UNIQUE
  - Asigna valores temporales a registros existentes

---

## Pasos para Ejecutar las Migraciones

### Opción 1: Usando TypeORM CLI (Recomendado)

```bash
# 1. Navegar al directorio del backend
cd D:\Projects\Personal\mdg-backend

# 2. Verificar que las migraciones están registradas
npm run typeorm migration:show

# 3. Ejecutar las migraciones
npm run typeorm migration:run

# 4. Verificar que se ejecutaron correctamente
npm run typeorm migration:show
```

### Opción 2: Usando TypeORM en el código

Si no tienes configurado el CLI, puedes ejecutar las migraciones desde el código:

```typescript
// En tu archivo de inicialización (ej: server.ts)
import { AppDataSource } from "./config/datasource";

async function runMigrations() {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();
  console.log("✅ Migraciones ejecutadas correctamente");
}

runMigrations();
```

### Opción 3: Ejecutar SQL directamente (PostgreSQL)

Si prefieres ejecutar SQL directamente:

```sql
-- Migración 1: Agregar CI a pacientes
ALTER TABLE pacientes ADD COLUMN ci VARCHAR(20);

-- Asignar CIs temporales
UPDATE pacientes SET ci = CONCAT('TEMP-', id::text) WHERE ci IS NULL;

-- Hacer NOT NULL
ALTER TABLE pacientes ALTER COLUMN ci SET NOT NULL;

-- Agregar constraint UNIQUE
ALTER TABLE pacientes ADD CONSTRAINT uq_pacientes_ci UNIQUE (ci);

-- Crear índice
CREATE UNIQUE INDEX idx_pacientes_ci ON pacientes(ci);


-- Migración 2: Actualizar psicólogos
-- Actualizar CI
UPDATE psicologos SET ci = CONCAT('TEMP-', id::text) WHERE ci IS NULL OR ci = '';
ALTER TABLE psicologos ALTER COLUMN ci SET NOT NULL;
ALTER TABLE psicologos ADD CONSTRAINT uq_psicologos_ci UNIQUE (ci);

-- Actualizar matrícula profesional
UPDATE psicologos
SET matricula_profesional = CONCAT('TEMP-MAT-', id::text)
WHERE matricula_profesional IS NULL OR matricula_profesional = '';

ALTER TABLE psicologos ALTER COLUMN matricula_profesional SET NOT NULL;
ALTER TABLE psicologos ADD CONSTRAINT uq_psicologos_matricula UNIQUE (matricula_profesional);
```

---

## ⚠️ IMPORTANTE: Actualizar Datos Temporales

Después de ejecutar las migraciones, **debes actualizar** los registros con CIs y matrículas temporales:

### 1. Verificar registros temporales

```sql
-- Ver pacientes con CI temporal
SELECT id, nombres, apellidos, ci
FROM pacientes
WHERE ci LIKE 'TEMP-%';

-- Ver psicólogos con CI temporal
SELECT id, nombres, apellidos, ci, matricula_profesional
FROM psicologos
WHERE ci LIKE 'TEMP-%' OR matricula_profesional LIKE 'TEMP-MAT-%';
```

### 2. Actualizar con datos reales

```sql
-- Ejemplo: Actualizar CI de un paciente
UPDATE pacientes
SET ci = '1234567890'
WHERE id = 'uuid-del-paciente';

-- Ejemplo: Actualizar CI y matrícula de un psicólogo
UPDATE psicologos
SET
  ci = '9876543210',
  matricula_profesional = 'PSI-12345'
WHERE id = 'uuid-del-psicologo';
```

---

## Verificar que las Migraciones Funcionan

### 1. Verificar estructura de tablas

```sql
-- Ver columnas de pacientes
\d pacientes;

-- Ver columnas de psicólogos
\d psicologos;

-- Ver constraints
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'pacientes'::regclass;

SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'psicologos'::regclass;
```

### 2. Probar inserción de datos

```sql
-- Intentar insertar paciente sin CI (debe fallar)
INSERT INTO pacientes (id, nombres, apellidos, fecha_nacimiento)
VALUES (gen_random_uuid(), 'Juan', 'Pérez', '1990-01-01');
-- Error: null value in column "ci" violates not-null constraint

-- Intentar insertar paciente con CI duplicado (debe fallar)
INSERT INTO pacientes (id, nombres, apellidos, ci, fecha_nacimiento)
VALUES (gen_random_uuid(), 'Juan', 'Pérez', '1234567890', '1990-01-01');
-- Error: duplicate key value violates unique constraint "uq_pacientes_ci"

-- Inserción correcta
INSERT INTO pacientes (id, nombres, apellidos, ci, fecha_nacimiento, telefono)
VALUES (gen_random_uuid(), 'Juan', 'Pérez', '1234567890', '1990-01-01', '0991234567');
-- Success!
```

---

## Revertir Migraciones (Si es necesario)

Si algo sale mal y necesitas revertir:

```bash
# Revertir la última migración
npm run typeorm migration:revert

# Revertir ambas migraciones
npm run typeorm migration:revert
npm run typeorm migration:revert
```

O manualmente:

```sql
-- Revertir constraints de psicólogos
ALTER TABLE psicologos DROP CONSTRAINT IF EXISTS uq_psicologos_matricula;
ALTER TABLE psicologos ALTER COLUMN matricula_profesional DROP NOT NULL;
ALTER TABLE psicologos DROP CONSTRAINT IF EXISTS uq_psicologos_ci;
ALTER TABLE psicologos ALTER COLUMN ci DROP NOT NULL;

-- Revertir CI de pacientes
DROP INDEX IF EXISTS idx_pacientes_ci;
ALTER TABLE pacientes DROP CONSTRAINT IF EXISTS uq_pacientes_ci;
ALTER TABLE pacientes DROP COLUMN ci;
```

---

## Configuración de TypeORM para Migraciones

Asegúrate de que tu `datasource.ts` tenga la configuración correcta:

```typescript
// src/config/datasource.ts
import { DataSource } from "typeorm";
import { Paciente } from "../entities/Paciente.entity";
import { Psicologo } from "../entities/Psicologo.entity";
// ... otras entidades

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "mdg_db",
  entities: [Paciente, Psicologo /* ... otras */],
  migrations: ["src/migrations/*.ts"], // ← Importante
  synchronize: false, // ← Usar false en producción
  logging: true,
});
```

### Agregar scripts en package.json

```json
{
  "scripts": {
    "typeorm": "typeorm-ts-node-commonjs",
    "migration:run": "npm run typeorm migration:run -- -d src/config/datasource.ts",
    "migration:revert": "npm run typeorm migration:revert -- -d src/config/datasource.ts",
    "migration:show": "npm run typeorm migration:show -- -d src/config/datasource.ts",
    "migration:generate": "npm run typeorm migration:generate -- -d src/config/datasource.ts"
  }
}
```

---

## Checklist de Ejecución

- [ ] Hacer backup de la base de datos
- [ ] Ejecutar migraciones en ambiente de desarrollo primero
- [ ] Verificar que las tablas tienen las columnas correctas
- [ ] Verificar que los constraints están aplicados
- [ ] Actualizar registros con datos temporales
- [ ] Probar inserción de nuevos pacientes/psicólogos desde la UI
- [ ] Verificar que la validación de CI duplicado funciona
- [ ] Ejecutar en ambiente de producción (si aplica)

---

## Solución de Problemas

### Error: "relation already exists"
- La migración ya fue ejecutada
- Verificar con `npm run typeorm migration:show`

### Error: "duplicate key value"
- Ya existen registros con el mismo CI
- Verificar duplicados: `SELECT ci, COUNT(*) FROM pacientes GROUP BY ci HAVING COUNT(*) > 1`

### Error: "column does not exist"
- La migración no se ejecutó correctamente
- Verificar estructura de tabla: `\d pacientes`

### Error: "cannot drop column because it has dependencies"
- Eliminar constraints primero antes de eliminar columnas

---

## Contacto y Soporte

Si encuentras problemas durante la migración:
1. Revisa los logs de TypeORM
2. Verifica la estructura de la base de datos con `\d tablename`
3. Consulta la documentación de TypeORM: https://typeorm.io/migrations

**IMPORTANTE**: Siempre haz un backup de tu base de datos antes de ejecutar migraciones en producción.

---

# 🔐 Migración de Cifrado de Datos Clínicos

## Descripción

Esta migración actualiza las tablas `historial_tratamiento` y `historial_sesion` para soportar cifrado de extremo a extremo de información clínica sensible.

**Archivo**: `src/migrations/EncryptClinicalData.ts`

## ⚠️ CRÍTICO: Antes de Ejecutar

### 1. Respaldar la Base de Datos

```bash
# PostgreSQL backup
pg_dump -h localhost -U your_user -d your_database > backup_before_encryption_$(date +%Y%m%d).sql
```

### 2. Verificar Configuración

En `src/config/datasource.ts`, **DEBES cambiar temporalmente**:

```typescript
// ANTES de ejecutar la migración
synchronize: false,  // Cambiar de true a false
```

⚠️ Con `synchronize: true`, TypeORM podría interferir con la migración manual.

## 📋 Cambios que Aplica la Migración

### Tabla: historial_tratamiento

Renombra las siguientes columnas agregando el sufijo `_encrypted`:
- `antecedentes_terapeuticos_previos` → `antecedentes_terapeuticos_previos_encrypted`
- `consumo_detalle` → `consumo_detalle_encrypted`
- `observaciones_clinicas` → `observaciones_clinicas_encrypted`
- `hipotesis_diagnostica` → `hipotesis_diagnostica_encrypted`
- `diagnostico_clinico` → `diagnostico_clinico_encrypted`
- `objetivo_general` → `objetivo_general_encrypted`
- `objetivos_especificos` → `objetivos_especificos_encrypted`
- `plan_trabajo` → `plan_trabajo_encrypted`
- `recomendaciones_iniciales` → `recomendaciones_iniciales_encrypted`
- `tareas_terapeuticas` → `tareas_terapeuticas_encrypted`
- `comentarios_finales` → `comentarios_finales_encrypted`

### Tabla: historial_sesion

Renombra las siguientes columnas agregando el sufijo `_encrypted`:
- `seguimiento` → `seguimiento_encrypted`
- `recomendaciones` → `recomendaciones_encrypted`
- `objetivos_proxima_sesion` → `objetivos_proxima_sesion_encrypted`

## 🚀 Ejecutar la Migración

### Opción 1: Usando TypeORM CLI (Recomendado)

```bash
# 1. Navegar al directorio del backend
cd D:\Projects\Personal\mdg-backend

# 2. Cambiar synchronize a false en datasource.ts

# 3. Ejecutar la migración
npm run migration:run
# O si no tienes el script:
npx typeorm-ts-node-commonjs migration:run -d src/config/datasource.ts

# 4. Verificar que se aplicó correctamente
psql -U your_user -d your_database -c "\d historial_tratamiento"
psql -U your_user -d your_database -c "\d historial_sesion"
```

### Opción 2: Ejecutar SQL Manualmente

```bash
# Conectarse a PostgreSQL
psql -h localhost -U your_user -d your_database
```

Luego ejecutar:

```sql
-- HISTORIAL_TRATAMIENTO TABLE
ALTER TABLE historial_tratamiento
  RENAME COLUMN antecedentes_terapeuticos_previos TO antecedentes_terapeuticos_previos_encrypted;
ALTER TABLE historial_tratamiento
  RENAME COLUMN consumo_detalle TO consumo_detalle_encrypted;
ALTER TABLE historial_tratamiento
  RENAME COLUMN observaciones_clinicas TO observaciones_clinicas_encrypted;
ALTER TABLE historial_tratamiento
  RENAME COLUMN hipotesis_diagnostica TO hipotesis_diagnostica_encrypted;
ALTER TABLE historial_tratamiento
  RENAME COLUMN diagnostico_clinico TO diagnostico_clinico_encrypted;
ALTER TABLE historial_tratamiento
  RENAME COLUMN objetivo_general TO objetivo_general_encrypted;
ALTER TABLE historial_tratamiento
  RENAME COLUMN objetivos_especificos TO objetivos_especificos_encrypted;
ALTER TABLE historial_tratamiento
  RENAME COLUMN plan_trabajo TO plan_trabajo_encrypted;
ALTER TABLE historial_tratamiento
  RENAME COLUMN recomendaciones_iniciales TO recomendaciones_iniciales_encrypted;
ALTER TABLE historial_tratamiento
  RENAME COLUMN tareas_terapeuticas TO tareas_terapeuticas_encrypted;
ALTER TABLE historial_tratamiento
  RENAME COLUMN comentarios_finales TO comentarios_finales_encrypted;

-- HISTORIAL_SESION TABLE
ALTER TABLE historial_sesion
  RENAME COLUMN seguimiento TO seguimiento_encrypted;
ALTER TABLE historial_sesion
  RENAME COLUMN recomendaciones TO recomendaciones_encrypted;
ALTER TABLE historial_sesion
  RENAME COLUMN objetivos_proxima_sesion TO objetivos_proxima_sesion_encrypted;
```

## 📊 Manejo de Datos Existentes

### ⚠️ CRÍTICO: Los Datos Existentes NO Están Cifrados

Después de ejecutar la migración, los datos existentes en estas columnas **NO estarán cifrados** automáticamente.

Tienes dos opciones:

#### Opción A: Limpiar Datos (Recomendado para desarrollo)

```sql
-- Eliminar todos los tratamientos y sesiones
DELETE FROM historial_sesion;
DELETE FROM historial_tratamiento;

-- O actualizar campos a NULL
UPDATE historial_tratamiento SET
  antecedentes_terapeuticos_previos_encrypted = NULL,
  consumo_detalle_encrypted = NULL,
  observaciones_clinicas_encrypted = NULL,
  hipotesis_diagnostica_encrypted = NULL,
  diagnostico_clinico_encrypted = NULL,
  objetivo_general_encrypted = NULL,
  objetivos_especificos_encrypted = NULL,
  plan_trabajo_encrypted = NULL,
  recomendaciones_iniciales_encrypted = NULL,
  tareas_terapeuticas_encrypted = NULL,
  comentarios_finales_encrypted = NULL;

UPDATE historial_sesion SET
  seguimiento_encrypted = NULL,
  recomendaciones_encrypted = NULL,
  objetivos_proxima_sesion_encrypted = NULL;
```

#### Opción B: Cifrar Datos Existentes (Para Producción)

Necesitarás crear un script especial que:
1. Lea los datos existentes desde el frontend (donde están las llaves de cifrado)
2. Los cifre usando las mismas funciones de cifrado
3. Actualice los registros con los datos cifrados

**Este script debe ejecutarse desde el frontend** porque el backend NO tiene acceso a las llaves de cifrado.

## 🔄 Después de la Migración

1. **Restaurar configuración de TypeORM** (si la cambiaste):
```typescript
// En src/config/datasource.ts
synchronize: true,  // Volver a true si es tu configuración habitual
```

2. **Reiniciar el servidor backend**:
```bash
npm run dev
```

3. **Verificar funcionamiento completo**:
   - Crear un nuevo tratamiento desde el frontend
   - Verificar que se guarda correctamente cifrado
   - Leer el tratamiento y verificar que se descifra correctamente
   - Crear una nueva sesión
   - Verificar funcionamiento de sesiones

4. **Verificar en base de datos** que los datos están cifrados:
```sql
-- Los datos deben verse como JSON con iv y ciphertext
SELECT antecedentes_terapeuticos_previos_encrypted
FROM historial_tratamiento
LIMIT 1;

-- Debe verse algo como: {"iv":"...","ciphertext":"..."}
```

## 🔙 Revertir la Migración

Si algo sale mal:

```bash
# Con TypeORM CLI
npm run migration:revert
# O:
npx typeorm-ts-node-commonjs migration:revert -d src/config/datasource.ts
```

O manualmente:

```sql
-- Revertir historial_tratamiento
ALTER TABLE historial_tratamiento
  RENAME COLUMN antecedentes_terapeuticos_previos_encrypted TO antecedentes_terapeuticos_previos;
ALTER TABLE historial_tratamiento
  RENAME COLUMN consumo_detalle_encrypted TO consumo_detalle;
ALTER TABLE historial_tratamiento
  RENAME COLUMN observaciones_clinicas_encrypted TO observaciones_clinicas;
ALTER TABLE historial_tratamiento
  RENAME COLUMN hipotesis_diagnostica_encrypted TO hipotesis_diagnostica;
ALTER TABLE historial_tratamiento
  RENAME COLUMN diagnostico_clinico_encrypted TO diagnostico_clinico;
ALTER TABLE historial_tratamiento
  RENAME COLUMN objetivo_general_encrypted TO objetivo_general;
ALTER TABLE historial_tratamiento
  RENAME COLUMN objetivos_especificos_encrypted TO objetivos_especificos;
ALTER TABLE historial_tratamiento
  RENAME COLUMN plan_trabajo_encrypted TO plan_trabajo;
ALTER TABLE historial_tratamiento
  RENAME COLUMN recomendaciones_iniciales_encrypted TO recomendaciones_iniciales;
ALTER TABLE historial_tratamiento
  RENAME COLUMN tareas_terapeuticas_encrypted TO tareas_terapeuticas;
ALTER TABLE historial_tratamiento
  RENAME COLUMN comentarios_finales_encrypted TO comentarios_finales;

-- Revertir historial_sesion
ALTER TABLE historial_sesion
  RENAME COLUMN seguimiento_encrypted TO seguimiento;
ALTER TABLE historial_sesion
  RENAME COLUMN recomendaciones_encrypted TO recomendaciones;
ALTER TABLE historial_sesion
  RENAME COLUMN objetivos_proxima_sesion_encrypted TO objetivos_proxima_sesion;
```

## 📝 Notas de Seguridad

- ✅ Los nuevos registros se cifran automáticamente desde el frontend
- ✅ El backend NUNCA tiene acceso a las llaves de cifrado
- ✅ Los datos se almacenan cifrados en formato JSON: `{"iv":"...","ciphertext":"..."}`
- ✅ Cada campo se cifra independientemente con su propio IV
- ⚠️ Los datos existentes NO se cifran automáticamente
- ⚠️ Debes manejar los datos existentes antes de usar el sistema en producción

## ✅ Checklist de Ejecución

- [ ] Hacer backup completo de la base de datos
- [ ] Cambiar `synchronize: false` en datasource.ts
- [ ] Ejecutar la migración
- [ ] Verificar que las columnas se renombraron correctamente
- [ ] Decidir qué hacer con los datos existentes (limpiar o cifrar)
- [ ] Restaurar `synchronize: true` si es necesario
- [ ] Reiniciar el servidor backend
- [ ] Probar crear un nuevo tratamiento desde la UI
- [ ] Verificar que los datos se guardan cifrados en la BD
- [ ] Probar leer tratamientos existentes
- [ ] Probar crear y leer sesiones
- [ ] Verificar que no hay errores en consola del navegador
- [ ] Verificar que no hay errores en logs del servidor

## 🆘 Solución de Problemas

### Error: "column does not exist"
- La migración no se ejecutó correctamente
- Verificar con: `\d historial_tratamiento`
- Re-ejecutar la migración

### Error en frontend: "Cannot read property 'text' of undefined"
- Los datos en la BD no están cifrados correctamente
- Verificar formato: debe ser JSON `{"iv":"...","ciphertext":"..."}`
- Limpiar datos existentes o cifrarlos correctamente

### Error: "relation already exists"
- Las columnas ya fueron renombradas
- Verificar el estado de las migraciones con: `npm run migration:show`

### Los datos se guardan pero no se pueden leer
- Verificar que las llaves de cifrado son las mismas para guardar y leer
- Verificar que el formato en BD es correcto (JSON con iv y ciphertext)
- Revisar la consola del navegador para errores de descifrado

---

**RECORDATORIO**: Esta migración es crítica para la seguridad de los datos clínicos. Asegúrate de probarla completamente en un ambiente de desarrollo antes de aplicarla en producción.
