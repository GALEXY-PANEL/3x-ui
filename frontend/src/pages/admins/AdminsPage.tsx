import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Layout,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  message,
} from 'antd';
import type { TableColumnsType } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { theme } from 'antd';
import { usePageTitle } from '@/hooks/usePageTitle';
import { HttpUtil, SizeFormatter } from '@/utils';
import AppSidebar from '@/layouts/AppSidebar';

interface Admin {
  id: number;
  username: string;
  roleId: number;
  status: string;
  dataLimit: number;
  usedBytes: number;
  note: string;
  createdAt: number;
  updatedAt: number;
}

interface AdminRole {
  id: number;
  name: string;
  slug: string;
}

export default function AdminsPage() {
  const { t } = useTranslation();
  usePageTitle(t('admins.title', 'مدیریت ادمین‌ها و نمایندگان'));
  const { token } = theme.useToken();
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [form] = Form.useForm();

  const { data: admins = [], isLoading: isLoadingAdmins } = useQuery<Admin[]>({
    queryKey: ['admins-list'],
    queryFn: async () => {
      const res = await HttpUtil.get('/panel/api/admins/list');
      return res?.obj || [];
    },
  });

  const { data: roles = [] } = useQuery<AdminRole[]>({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const res = await HttpUtil.get('/panel/api/admins/roles');
      return res?.obj || [];
    },
  });

  const roleMap = roles.reduce((acc, r) => ({ ...acc, [r.id]: r.name }), {} as Record<number, string>);

  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      const payload = {
        ...values,
        dataLimit: (values.dataLimitGB || 0) * 1024 * 1024 * 1024,
      };
      if (editingAdmin) {
        return HttpUtil.post(`/panel/api/admins/update/${editingAdmin.id}`, payload);
      }
      return HttpUtil.post('/panel/api/admins/create', payload);
    },
    onSuccess: (res: any) => {
      if (res?.success) {
        message.success(t('common.saved', 'ادمین با موفقیت ذخیره شد'));
        setModalVisible(false);
        setEditingAdmin(null);
        form.resetFields();
        queryClient.invalidateQueries({ queryKey: ['admins-list'] });
      } else {
        message.error(res?.msg || t('common.failed', 'خطا در ذخیره‌سازی'));
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return HttpUtil.post(`/panel/api/admins/delete/${id}`);
    },
    onSuccess: (res: any) => {
      if (res?.success) {
        message.success(t('common.deleted', 'ادمین حذف شد'));
        queryClient.invalidateQueries({ queryKey: ['admins-list'] });
      } else {
        message.error(res?.msg || t('common.failed', 'خطا در حذف'));
      }
    },
  });

  const openCreateModal = () => {
    setEditingAdmin(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active', roleId: roles[0]?.id || 1, dataLimitGB: 0 });
    setModalVisible(true);
  };

  const openEditModal = (admin: Admin) => {
    setEditingAdmin(admin);
    form.setFieldsValue({
      ...admin,
      password: '',
      dataLimitGB: admin.dataLimit ? admin.dataLimit / (1024 * 1024 * 1024) : 0,
    });
    setModalVisible(true);
  };

  const columns: TableColumnsType<Admin> = [
    {
      title: t('admins.username', 'نام کاربری'),
      dataIndex: 'username',
      key: 'username',
      render: (text) => (
        <Space>
          <UserOutlined />
          <strong>{text}</strong>
        </Space>
      ),
    },
    {
      title: t('admins.role', 'نقش'),
      dataIndex: 'roleId',
      key: 'roleId',
      render: (id) => <Tag color="blue">{roleMap[id] || `نقش #${id}`}</Tag>,
    },
    {
      title: t('admins.status', 'وضعیت'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'success' : 'error'}>
          {status === 'active' ? 'فعال' : 'غیرفعال'}
        </Tag>
      ),
    },
    {
      title: t('admins.traffic', 'مصرف / سقف ترافیک'),
      key: 'traffic',
      render: (_, record) => (
        <span>
          {SizeFormatter.formatBytes(record.usedBytes || 0)} /{' '}
          {record.dataLimit > 0 ? SizeFormatter.formatBytes(record.dataLimit) : 'نامحدود'}
        </span>
      ),
    },
    {
      title: t('admins.note', 'یادداشت'),
      dataIndex: 'note',
      key: 'note',
    },
    {
      title: t('common.actions', 'عملیات'),
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title={t('common.edit', 'ویرایش')}>
            <Button
              type="text"
              icon={<EditOutlined style={{ color: token.colorPrimary }} />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          <Tooltip title={t('common.delete', 'حذف')}>
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: t('common.confirmDelete', 'آیا از حذف این ادمین مطمئن هستید؟'),
                  onOk: () => deleteMutation.mutate(record.id),
                });
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <AppSidebar />
      <Layout.Content style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <h1 style={{ fontSize: '24px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TeamOutlined style={{ color: token.colorPrimary }} />
              {t('admins.title', 'مدیریت ادمین‌ها و نمایندگان')}
            </h1>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              {t('admins.create', 'افزودن ادمین جدید')}
            </Button>
          </Col>
        </Row>

        <Card style={{ background: 'rgba(20, 24, 39, 0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Table
            dataSource={admins}
            columns={columns}
            rowKey="id"
            loading={isLoadingAdmins}
            pagination={{ pageSize: 10 }}
          />
        </Card>

        <Modal
          title={editingAdmin ? t('admins.edit', 'ویرایش ادمین') : t('admins.create', 'ایجاد ادمین جدید')}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          onOk={() => form.submit()}
          confirmLoading={saveMutation.isPending}
        >
          <Form form={form} layout="vertical" onFinish={(vals) => saveMutation.mutate(vals)}>
            <Form.Item name="username" label={t('admins.username', 'نام کاربری')} rules={[{ required: true }]}>
              <Input placeholder="username" disabled={!!editingAdmin} />
            </Form.Item>
            <Form.Item
              name="password"
              label={t('admins.password', 'رمز عبور')}
              rules={[{ required: !editingAdmin, message: 'لطفاً رمز عبور را وارد کنید' }]}
            >
              <Input.Password placeholder={editingAdmin ? 'در صورت عدم تغییر خالی بگذارید' : 'password'} />
            </Form.Item>
            <Form.Item name="roleId" label={t('admins.role', 'نقش دسترسی')} rules={[{ required: true }]}>
              <Select
                options={roles.map((r) => ({ label: r.name, value: r.id }))}
                placeholder="انتخاب نقش"
              />
            </Form.Item>
            <Form.Item name="status" label={t('admins.status', 'وضعیت')} rules={[{ required: true }]}>
              <Select
                options={[
                  { label: 'فعال (Active)', value: 'active' },
                  { label: 'غیرفعال (Disabled)', value: 'disabled' },
                ]}
              />
            </Form.Item>
            <Form.Item name="dataLimitGB" label={t('admins.dataLimit', 'سقف کل ترافیک (GB)')}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="0 = نامحدود" />
            </Form.Item>
            <Form.Item name="note" label={t('admins.note', 'یادداشت')}>
              <Input.TextArea placeholder="توضیحات و یادداشت" />
            </Form.Item>
          </Form>
        </Modal>
      </Layout.Content>
    </Layout>
  );
}
