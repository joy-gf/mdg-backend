export interface Usuario {
  id: string;
  userName: string;
  password: string;
  roleId: string;
  debeCambiarPassword?: boolean;
}

export interface UsuarioInput {
  userName?: string;
  password?: string;
  roleId?: string | number;
  foto_perfil?: string | null;
  debeCambiarPassword?: boolean;
}