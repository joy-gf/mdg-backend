# Diario Emocional - Backend API

## 🔒 Arquitectura de Seguridad

El Diario Emocional almacena las entradas en **texto plano en el backend** para permitir el acceso por parte del psicólogo tratante y servicios de análisis ML.

### Flujo de Datos

```
Frontend (Navegador)
    ↓
[Entrada almacenada encriptada localmente en IndexedDB]
    ↓
[Envía texto plano al backend via HTTPS]
    ↓
Backend API
    ↓
[Guarda texto en PostgreSQL]
    ↓
[Accesible para psicólogo asignado]
    ↓
Microservicio ML (próximo)
    ↓
[Analiza sentimiento del texto]
    ↓
[Guarda resultado del análisis]
```

### Protección de Datos

✅ **Transporte**: Conexión HTTPS encriptada
✅ **Frontend**: Entradas encriptadas en IndexedDB local
✅ **Control de acceso**: Solo paciente y psicólogo asignado pueden acceder
✅ **Logs**: No se registran datos sensibles del paciente

---

## 📋 Endpoints Disponibles

### 1. Crear Entrada de Diario

**POST** `/api/diario-emocional`

```json
{
  "paciente_id": "uuid-del-paciente",
  "fecha_entrada": "2024-01-22",
  "emocion_seleccionada": "Feliz",
  "texto_entrada": "Hoy me sentí muy bien..."
}
```

**Response:**
```json
{
  "id": "uuid-generado",
  "paciente_id": "uuid-del-paciente",
  "fecha_entrada": "2024-01-22",
  "emocion_seleccionada": "Feliz",
  "texto_entrada": "Hoy me sentí muy bien...",
  "created_at": "2024-01-22T10:30:00Z"
}
```

### 2. Obtener Entradas por Paciente

**GET** `/api/diario-emocional/paciente/:pacienteId`

Query params opcionales:
- `desde`: YYYY-MM-DD (fecha inicio)
- `hasta`: YYYY-MM-DD (fecha fin)

**Response:**
```json
[
  {
    "id": "uuid-1",
    "paciente_id": "uuid-paciente",
    "fecha_entrada": "2024-01-22",
    "emocion_seleccionada": "Feliz",
    "texto_entrada": "Hoy me sentí muy bien...",
    "created_at": "2024-01-22T10:30:00Z"
  }
]
```

### 3. Obtener Entrada Específica

**GET** `/api/diario-emocional/:id?paciente_id=uuid`

**Importante:** Requiere `paciente_id` como query param para validación de seguridad.

### 4. Contar Entradas

**GET** `/api/diario-emocional/paciente/:pacienteId/count`

**Response:**
```json
{
  "count": 15
}
```

---

## 🔐 Configuración de Seguridad

### Backend

El backend no requiere configuración especial de encriptación para el diario emocional.
La seguridad se maneja mediante:
- Autenticación JWT
- Control de acceso basado en roles
- Validación de pertenencia (paciente-entrada)

### Frontend

El frontend encripta las entradas localmente en IndexedDB:

```typescript
import { encryptJson } from '@/utils/crypto';

// 1. Derivar clave del password del usuario
const key = await deriveKeyFromPassword(
  userPassword,
  userId
);

// 2. Enviar texto plano al backend
await api.post('/diario-emocional', {
  paciente_id: pacienteId,
  fecha_entrada: new Date().toISOString().split('T')[0],
  emocion_seleccionada: emocion,
  texto_entrada: textoDelDiario  // Texto plano
});
```

---

## 🚧 Pendientes de Implementación

### Alta Prioridad

- [ ] **Integración ML**: Conectar con microservicio de análisis de sentimiento
  - Leer texto plano desde entrada
  - Llamar a `http://localhost:8000/analyze`
  - Guardar resultado del análisis (próxima entidad)

- [ ] **Validación de Permisos**: Mejorar middleware de autenticación
  - Verificar que psicólogo esté asignado al paciente antes de permitir lectura

### Media Prioridad

- [ ] **Nueva Entidad**: `AnalisisSentimiento`
  - Relacionada con `DiarioEmocional`
  - Guarda resultados del ML (sin texto plano)

- [ ] **Sincronización Offline**:
  - Manejar entradas creadas sin conexión
  - Sincronizar cuando vuelva la conexión

### Baja Prioridad

- [ ] **Auditoría**: Registrar quién accede a qué entrada
- [ ] **Exportación**: PDF encriptado para el paciente
- [ ] **Retención**: Política de borrado después de X años

---

## 🛡️ Reglas de Seguridad

### ✅ PERMITIDO

- Crear entradas (solo el paciente autenticado)
- Leer propias entradas (paciente autenticado)
- Leer entradas de pacientes asignados (psicólogo autenticado)

### ❌ PROHIBIDO

- Borrar entradas (preservación de historial)
- Acceder a entradas de otros pacientes (privacidad)
- Acceder a entradas de pacientes no asignados (psicólogos)

---

## 🗄️ Esquema de Base de Datos

```sql
CREATE TABLE diario_emocional (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  fecha_entrada DATE NOT NULL,
  emocion_seleccionada VARCHAR(50) NOT NULL,
  texto_entrada TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_diario_paciente ON diario_emocional(paciente_id);
CREATE INDEX idx_diario_fecha ON diario_emocional(fecha_entrada);
```

---

## 📝 Notas Técnicas

### Control de Acceso

- **Paciente**: Solo puede crear y leer sus propias entradas
- **Psicólogo**: Puede leer entradas de pacientes asignados
- **Admin**: No tiene acceso directo a entradas clínicas

### Performance

- Lectura directa de texto plano desde PostgreSQL
- Sin overhead de encriptación/desencriptación
- Indexado por paciente_id y fecha_entrada

### Seguridad en Tránsito

✅ Conexión HTTPS obligatoria en producción
✅ Tokens JWT para autenticación
✅ Validación de pertenencia en cada request

---

## 🐛 Troubleshooting

### Error: "Entrada no encontrada"

- Verificar que el `paciente_id` coincida con el owner de la entrada
- Verificar permisos de autenticación
- Para psicólogos: verificar que el paciente esté asignado

### Error: "PACIENTE_ID_REQUERIDO"

- Asegurarse de incluir el campo `paciente_id` en el body (POST) o query params (GET)

---

## 📚 Referencias

- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [AES-GCM Encryption](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
