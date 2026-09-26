import { DEPARTMENTS } from '../../server/faculty';

export default function handler(_req: any, res: any) {
  const depts = Object.values(DEPARTMENTS).map((d) => ({
    code: d.code,
    name: d.name,
  }));
  return res.json({ success: true, departments: depts });
}
