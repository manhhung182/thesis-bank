import { supabase } from './supabase'

// Lấy danh sách đề tài (có kèm sinh viên và GVHD)
export async function getTheses({ year, field, type, search } = {}) {
  let query = supabase
    .from('theses')
    .select(`
      *,
      thesis_students (
        is_leader,
        students ( full_name, mssv, class )
      ),
      thesis_advisors (
        advisors ( full_name, email )
      )
    `)
    .order('created_at', { ascending: false })

  if (year)   query = query.eq('year', year)
  if (field)  query = query.eq('field', field)
  if (type)   query = query.eq('type', type)
  if (search) query = query.ilike('title', `%${search}%`)

  const { data, error } = await query
  if (error) throw error
  return data
}

// Kiểm tra trùng lặp tên đề tài
export async function checkDuplicate(title) {
  const { data } = await supabase
    .from('theses')
    .select('id, title, year')
    .ilike('title', `%${title.split(' ').slice(0, 5).join('%')}%`)
  return data
}

// Thêm đề tài mới
export async function addThesis({ thesis, students, advisorIds }) {
  // 1. Insert đề tài
  const { data: newThesis, error } = await supabase
    .from('theses')
    .insert(thesis)
    .select()
    .single()
  if (error) throw error

  // 2. Liên kết sinh viên
  if (students?.length) {
    const links = students.map((s, i) => ({
      thesis_id: newThesis.id,
      student_id: s.id,
      is_leader: i === 0,
    }))
    await supabase.from('thesis_students').insert(links)
  }

  // 3. Liên kết GVHD
  if (advisorIds?.length) {
    const links = advisorIds.map(aid => ({
      thesis_id: newThesis.id,
      advisor_id: aid,
    }))
    await supabase.from('thesis_advisors').insert(links)
  }

  return newThesis
}

// Upload file báo cáo
export async function uploadFile(thesisId, file) {
  const ext = file.name.split('.').pop()
  const path = `${thesisId}/baocao.${ext}`

  const { error } = await supabase.storage
    .from('thesis-files')
    .upload(path, file, { upsert: true })
  if (error) throw error

  // Lưu URL vào bảng theses
  await supabase
    .from('theses')
    .update({ file_url: path })
    .eq('id', thesisId)

  return path
}

// Thống kê theo năm
export async function getStatsByYear() {
  const { data } = await supabase
    .from('theses')
    .select('year, type, status')
  return data
}