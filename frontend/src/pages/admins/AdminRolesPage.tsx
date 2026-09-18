import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Layout,
  Modal,
  Row,
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
  KeyOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { theme } from 'antd';
import { usePageTitle } from '@/hooks/usePageTitle';
import { HttpUtil } from '@/utils';
import AppSidebar from '@/layouts/AppSidebar';

interface AdminRole {
  id: number;
  name: string;
  slug: string;
  description: string;
  permissions: string;
  createdAt: number;
  updatedAt: number;
}

export default function AdminRolesPage() {
  const { t } = useTranslation();
  usePageTitle(t('roles.title', 'مدیریت نقش‌ها'));
  const { token } = theme.useToken();
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<AdminRole | null>(null);
  const [form] = Form.useForm();

  const { data: roles = [], isLoading } = useQuery<AdminRole[]>({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const res = await HttpUtil.get('/panel/api/admins/roles');
      return res?.obj || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: Partial<AdminRole>) => {
      if (editingRole) {
        return HttpUtil.post(`/panel/api/admins/roles/update/${editingRole.id}`, values);
      }
      return HttpUtil.post('/panel/api/admins/roles/create', values);
    },
    onSuccess: (res: any) => {
      if (res?.success) {
        message.success(t('common.saved', 'نقش با موفقیت ذخیره شد'));
        setModalVisible(false);
        setEditingRole(null);
        form.resetFields();
        queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      } else {
        message.error(res?.msg || t('common.failed', 'خطا در ذخیره‌سازی'));
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return HttpUtil.post(`/panel/api/admins/roles/delete/${id}`);
    },
    onSuccess: (res: any) => {
      if (res?.success) {
        message.success(t('common.deleted', 'نقش حذف شد'));
        queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      } else {
        message.error(res?.msg || t('common.failed', 'خطا در حذف'));
      }
    },
  });

  const openCreateModal = () => {
    setEditingRole(null);
    form.resetFields();
    form.setFieldsValue({ permissions: '["*"]' });
    setModalVisible(true);
  };

  const openEditModal = (role: AdminRole) => {
    setEditingRole(role);
    form.setFieldsValue(role);
    setModalVisible(true);
  };

  const columns: TableColumnsType<AdminRole> = [
    {
      title: t('roles.name', 'نام نقش'),
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: t('roles.slug', 'شناسه یکتا (Slug)'),
      dataIndex: 'slug',
      key: 'slug',
      render: (text) => <Tag color="geekblue">{text}</Tag>,
    },
    {
      title: t('roles.description', 'توضیحات'),
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: t('roles.permissions', 'مجوزها'),
      dataIndex: 'permissions',
      key: 'permissions',
      render: (perms) => (
        <code style={{ fontSize: '12px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
          {perms}
        </code>
      ),
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
                  title: t('common.confirmDelete', 'آیا از حذف این نقش مطمئن هستید؟'),
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
              <SafetyCertificateOutlined style={{ color: token.colorPrimary }} />
              {t('roles.title', 'مدیریت نقش‌ها و دسترسی‌ها')}
            </h1>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              {t('roles.create', 'افزودن نقش جدید')}
            </Button>
          </Col>
        </Row>

        <Card style={{ background: 'rgba(20, 24, 39, 0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Table
            dataSource={roles}
            columns={columns}
            rowKey="id"
            loading={isLoading}
            pagination={{ pageSize: 10 }}
          />
        </Card>

        <Modal
          title={editingRole ? t('roles.edit', 'ویرایش نقش') : t('roles.create', 'ایجاد نقش جدید')}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          onOk={() => form.submit()}
          confirmLoading={saveMutation.isPending}
        >
          <Form form={form} layout="vertical" onFinish={(vals) => saveMutation.mutate(vals)}>
            <Form.Item name="name" label={t('roles.name', 'نام نقش')} rules={[{ required: true }]}>
              <Input placeholder="مثال: فروشنده، پشتیبان" />
            </Form.Item>
            <Form.Item name="slug" label={t('roles.slug', 'شناسه یکتا (Slug)')} rules={[{ required: true }]}>
              <Input placeholder="مثال: reseller, operator" disabled={!!editingRole} />
            </Form.Item>
            <Form.Item name="description" label={t('roles.description', 'توضیحات')}>
              <Input.TextArea placeholder="توضیح درباره وظایف این نقش" />
            </Form.Item>
            <Form.Item name="permissions" label={t('roles.permissions', 'مجوزها (JSON Array)')} rules={[{ required: true }]}>
              <Input.TextArea rows={3} placeholder='["*"] یا ["clients:read", "clients:create"]' />
            </Form.Item>
          </Form>
        </Modal>
      </Layout.Content>
    </Layout>
  );
}
