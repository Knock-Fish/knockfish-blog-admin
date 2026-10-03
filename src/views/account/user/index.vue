<template>
    <div class="page">
        <SearchBar class="search" @submit="handleSearch" @reset="handleReset"
            :search-list="searchList" :keyword="query" />
        <PageTable class="table" :columns="columns" :table-data="tableData"
            :page="page" slot-header="header" :loading="loading"
            @current-page="getList" @page-size="getList">
            <template #header>
                <DialogButton :permission="UserPerm.ADD" @click="onAddClick"
                    @submit="handleAdd" @closed="clearForm">
                    新增用户
                    <template #content>
                        <DynamicForm :ref="(el) => setFormRef('add', el)" v-model="formData"
                            :form-items="formItems">
                            <template #upload="{ model }">
                                <Upload v-model="model.avatar"
                                    :props="uploadProps" tip="建议尺寸1:1"
                                    :width="100" :height="100" />
                            </template>
                            <template #role-select="{ model }">
                                <ElSelect v-model="model.roleIds" multiple
                                    placeholder="请选择角色" :style="{ width: '100%' }">
                                    <ElOption v-for="role in roleList" :key="role.roleId"
                                        :label="role.roleName" :value="role.roleId" />
                                </ElSelect>
                            </template>
                        </DynamicForm>
                    </template>
                </DialogButton>
            </template>
            <template #username="{ row }">
                <div class="user">
                    <img :src="row.avatar" />
                    <div class="info">
                        <p>{{ row.username }}</p>
                        <p>{{ row.email }}</p>
                    </div>
                </div>
            </template>
            <template #roles="{ row }">
                <div class="role-tags">
                    <span v-for="role in row.roles" :key="role.roleId"
                        class="role-tag">{{ role.roleName }}</span>
                    <span v-if="!row.roles || row.roles.length === 0"
                        class="no-role">未分配角色</span>
                </div>
            </template>
            <template #option="{ row }">
                <DialogButton :permission="UserPerm.EDIT" :buttonBorder="false"
                    :button-props="editButtonProps"
                    :dialog-props="{ destroyOnClose: true }"
                    @click="onEditClick(row)" @submit="handleUpdate"
                    @closed="clearForm">
                    <SvgIcon icon="ri:pencil-line" />
                    <template #content>
                        <DynamicForm :ref="(el) => setFormRef('edit', el)" v-model="formData"
                            :form-items="formItems">
                            <template #upload="{ model }">
                                <Upload v-model="model.avatar"
                                    :props="uploadProps" tip="建议尺寸1:1"
                                    width="100px" height="100px" />
                            </template>
                            <template #role-select="{ model }">
                                <ElSelect v-model="model.roleIds" multiple
                                    placeholder="请选择角色" :style="{ width: '100%' }">
                                    <ElOption v-for="role in roleList" :key="role.roleId"
                                        :label="role.roleName" :value="role.roleId" />
                                </ElSelect>
                            </template>
                        </DynamicForm>
                    </template>
                </DialogButton>
                <DialogButton :buttonBorder="false" :permission="UserPerm.DELETE"
                    :button-props="delButtonProps" @click="handleDel(row)">
                    <SvgIcon icon="ri:delete-bin-6-line" />
                </DialogButton>
            </template>
        </PageTable>
    </div>
</template>

<script setup lang='ts'>
import { onMounted, reactive, ref, computed } from 'vue'
import { ElMessage, type ButtonProps, type UploadRequestOptions } from 'element-plus'
import { useTableColumnPermission } from '@/composables/useTableColumnPermission'
import { UserPerm } from '@/constants'
import { UserService } from '@/api/userApi'
import { R2FileService } from '@/api/r2FileApi'
import { RoleService } from '@/api/roleApi'
import { useUserStore } from '@/store/modules/user'
import { useCrudPage } from '@/composables/useCrudPage'
defineOptions({ name: 'User' })
type User = Api.User.UserInfo

const useStore = useUserStore()
const userId = useStore.info.userId
const fileId = ref<number>(0)
const updateAvatar = ref<string[]>([])
const isUsername = ref<boolean>(false)
const roleList = ref<Api.Role.RoleInfo[]>([])
const roleLoaded = ref<boolean>(false)
// 编辑 / 删除按钮样式（与原版一致：plain）
const editButtonProps: ButtonProps = {
  type: 'primary',
  plain: true,
}
const delButtonProps: ButtonProps = {
  type: 'danger',
  plain: true,
}

const {
  query, formData, page, tableData, loading,
  getList, clearForm, handleSearch, handleReset,
  handleAdd, handleDel,
  setFormRef, openAdd, openEdit,
} = useCrudPage<User>({
  api: {
    getList: UserService.getUserListData,
    // 后端已提供 POST /api/user（createUser）；删除端点（DELETE /api/user/{id}）后端尚未提供，
    // 前端 delUser 已补，但点击删除会 404，需后端补齐 @DeleteMapping 后生效。
    add: (data) => UserService.addUser(data as Api.User.UserCreate),
    update: UserService.updateUser,
    del: UserService.delUser,
  },
  idKey: 'userId',
  editFields: (row) => ({
    userId: row.userId,
    username: row.username,
    nickname: row.nickname,
    email: row.email,
    description: row.description,
    avatar: row.avatar,
    githubUrl: row.githubUrl,
    bilibiliUrl: row.bilibiliUrl,
  }),
  initialFormData: {
    username: '',
    avatar: '',
    nickname: '',
    description: '',
    githubUrl: '',
    bilibiliUrl: '',
    roleIds: [],
  },
})

// --------------- 新增：打开弹窗（清空 + 激活态 + 加载角色下拉） ---------------
const isAddMode = ref<boolean>(false)
const onAddClick = () => {
  isAddMode.value = true
  isUsername.value = false // 新增时账户可编辑
  openAdd() // 清空表单 + 设 activeMode='add'
  getRoleListData() // 预载角色下拉，避免新增弹窗里角色为空
}

// --------------- 编辑：在 openEdit（激活态 + 回填基本字段）基础上异步加载角色 ---------------
const onEditClick = async (row: User) => {
  isAddMode.value = false
  isUsername.value = true
  openEdit(row)
  await getRoleListData()
  const roles = await UserService.getUserRoles(row.userId!)
  formData.roleIds = roles.map((r) => r.roleId!).filter(Boolean) as number[]
}

// --------------- 编辑提交（保留原复杂逻辑：更新用户 + 角色 + 头像清理） ---------------
const handleUpdate = async () => {
  await UserService.updateUser(formData)
  if (formData.userId && formData.roleIds) {
    await UserService.updateUserRoles({
      userId: formData.userId,
      roleIds: formData.roleIds,
    })
  }
  if (updateAvatar.value.length != 0) {
    const avatarKey = formData.avatar ? new URL(formData.avatar).pathname.substring(1) : ''
    if (formData.avatar && updateAvatar.value.includes(avatarKey)) {
      const coversToDelete = updateAvatar.value.filter(
        url => url !== avatarKey
      )
      if (coversToDelete.length > 0) {
        await R2FileService.batchDelR2File(coversToDelete)
      }
      updateAvatar.value = [avatarKey]
    }
  }
  ElMessage({
    message: '编辑成功',
    type: 'success',
  })
  await getList()
}

// --------------- 角色下拉选项（带缓存） ---------------
const getRoleListData = async () => {
  if (roleLoaded.value) return
  const data = await RoleService.getRoleListData({
    pageNum: 1,
    pageSize: 100,
  })
  roleList.value = data.list
  roleLoaded.value = true
}

// --------------- 表单配置 ---------------
/** 新增/编辑 表单配置 */
const formItems = computed(() => [
  {
    type: 'Input',
    prop: 'username',
    label: '账户',
    props: {
      placeholder: '请输入账户',
      disabled: isUsername.value,
    },
    rules: {
      required: true,
      message: '账户不能为空',
      trigger: 'blur',
    },
  },
  // 密码：仅新增用户时必填（编辑走更新接口，不传密码）
  ...(isAddMode.value
    ? [{
        type: 'Input',
        prop: 'password',
        label: '密码',
        props: {
          type: 'password',
          placeholder: '请输入密码（新增用户必填）',
        },
        rules: {
          required: true,
          message: '密码不能为空',
          trigger: 'blur',
        },
      }]
    : []),
  {
    type: 'Input',
    prop: 'nickname',
    label: '昵称',
    props: {
      placeholder: '请输入昵称',
    },
    rules: {
      required: true,
      message: '昵称不能为空',
      trigger: 'blur',
    },
  },
  {
    type: 'Input',
    prop: 'email',
    label: '邮箱',
    props: {
      placeholder: '请输入邮箱',
    },
    rules: {
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      message: '请输入正确的邮箱格式',
      trigger: 'blur',
    },
  },
  {
    prop: 'avatar',
    label: '头像',
    slot: 'upload',
  },
  {
    type: 'Input',
    prop: 'description',
    label: '简介',
    props: {
      type: 'textarea',
      placeholder: '请输入简介',
      rows: 4,
    },
    rules: {
      required: true,
      message: '简介不能为空',
      trigger: 'blur',
    },
  },
  {
    type: 'Input',
    prop: 'githubUrl',
    label: 'GitHub地址',
    props: {
      placeholder: '请输入GitHub地址',
    },
  },
  {
    type: 'Input',
    prop: 'bilibiliUrl',
    label: 'B站地址',
    props: {
      placeholder: '请输入B站地址',
    },
  },
  {
    prop: 'roleIds',
    label: '角色',
    slot: 'role-select',
  },
])
const uploadProps = ref<Record<string, any>>({
  showFileList: false,
  httpRequest: async (options: UploadRequestOptions) => {
    const { file } = options
    if (userId) {
      const res = await R2FileService.uploadR2File({ file, type: 'avatar', userId })
      fileId.value = res.fileId
      updateAvatar.value.push(res.key)
      return res.url
    }
  },
  action: '',
})

/** 搜索栏配置 */
const searchList = [
  {
    prop: 'username',
    current: 'input',
    label: '账号',
    props: {
      placeholder: '请输入账号',
    },
  },
  {
    prop: 'nickname',
    current: 'input',
    label: '昵称',
    props: {
      placeholder: '请输入昵称',
    },
  },
  {
    prop: 'email',
    current: 'input',
    label: '邮箱',
    props: {
      placeholder: '请输入邮箱',
    },
  },
]

/** 表格 */
const columns = reactive([
  { type: 'index', label: '序号' },
  { prop: 'username', label: '账号', minWidth: '160', slot: 'username' },
  { prop: 'nickname', label: '昵称', minWidth: '160' },
  { prop: 'roles', label: '角色', minWidth: '150', slot: 'roles' },
  { prop: 'description', label: '简介', minWidth: '200', showOverflowTooltip: true },
  { prop: 'createTime', label: '创建时间', minWidth: '140' },
  { prop: 'action', label: '操作', fixed: 'right', slot: 'option', minWidth: '200', permission: ['user:edit', 'user:delete'] },
])
useTableColumnPermission(columns)

onMounted(getList)
</script>

<style lang="scss" scoped>
.page {
  @include page;

  .search {
    flex: 0 0 auto;
  }

  .table {
    margin-top: 10px;
    flex: 1 1 auto;
  }

  .roleText {
    color: rgb(255, 158, 97);
  }
}

.user {
  display: flex;
  align-items: center;

  img {
    border-radius: 50%;
    width: 40px;
    height: 40px;
  }

  .info {
    margin-left: 10px;
  }
}

.role-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .role-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;

    .role-tag {
      padding: 2px 8px;
      background: #ecf5ff;
      color: #409eff;
      border-radius: 4px;
      font-size: 12px;
    }

    .no-role {
      color: #909399;
      font-size: 12px;
    }
  }
}
</style>
