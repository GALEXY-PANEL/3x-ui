import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  Col,
  ConfigProvider,
  Form,
  Input,
  Layout,
  Modal,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Tooltip,
  message,
  theme,
} from 'antd';
import type { TableColumnsType } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useTheme } from '@/hooks/useTheme';
import { useMediaQuery } from '@/hooks/useMediaQuery';
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
  usePageTitle(t('roles.title', 'مدیریت نقش‌ها و دسترسی‌ها'));
  const { isDark, isUltra, antdThemeConfig } = useTheme();
  const { isMobile } = useMediaQuery();
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
      render: (text) => text || '-',
    },
    {
      title: t('roles.permissions', 'مجوزها'),
      dataIndex: 'permissions',
      key: 'permissions',
      render: (perms) => (
        <code style={{ fontSize: '12px', background: 'rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: '4px' }}>
          {perms}
        </code>
      ),
    },
    {
      title: t('common.actions', 'عملیات'),
      key: 'actions',
      width: 110,
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

  const pageClass = `groups-page${isDark ? ' is-dark' : ''}${isUltra ? ' is-ultra' : ''}`;

  return (
    <ConfigProvider theme={antdThemeConfig}>
      <Layout className={pageClass}>
        <AppSidebar />
        <Layout className="content-shell">
          <Layout.Content id="content-layout" className="content-area">
            <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 12]}>
              <Col span={24}>
                <Card size="small" hoverable className="summary-card">
                  <Row gutter={[16, isMobile ? 16 : 12]}>
                    <Col xs={12} sm={12} md={12}>
                      <Statistic
                        title={t('roles.totalRoles', 'تعداد نقش‌های تعریف‌شده')}
                        value={String(roles.length)}
                        prefix={<SafetyCertificateOutlined />}
                      />
                    </Col>
                    <Col xs={12} sm={12} md={12}>
                      <Statistic
                        title={t('roles.accessModel', 'مدل کنترل دسترسی')}
                        value="Role-Based (RBAC)"
                        prefix={<SafetyOutlined />}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>

              <Col span={24}>
                <Card
                  size="small"
                  hoverable
                  title={
                    <Space>
                      <SafetyCertificateOutlined style={{ color: token.colorPrimary }} />
                      <span>{t('roles.title', 'مدیریت نقش‌ها و مجوزها')}</span>
                    </Space>
                  }
                  extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                      {t('roles.create', 'افزودن نقش جدید')}
                    </Button>
                  }
                >
                  <Table
                    dataSource={roles}
                    columns={columns}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: t('common.empty', 'داده‌ای وجود ندارد') }}
                  />
                </Card>
              </Col>
            </Row>

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
      </Layout>
    </ConfigProvider>
  );
}
