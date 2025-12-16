import { AppDataSource } from "../config/datasource";
import { Consultorio } from "../entities/Consultorio.entity";

export class ConsultoriosService {
  private static repo = AppDataSource.getRepository(Consultorio);

  static getAll() {
    return this.repo.find({
      order: { name: "ASC" },
    });
  }

  static create(data: { name: string }) {
    const consultorio = this.repo.create(data);
    return this.repo.save(consultorio);
  }

  static update(id: string, data: Partial<Consultorio>) {
    return this.repo.save({ id, ...data });
  }

  static async delete(id: string) {
    await this.repo.delete(id);
    return { success: true };
  }
}
