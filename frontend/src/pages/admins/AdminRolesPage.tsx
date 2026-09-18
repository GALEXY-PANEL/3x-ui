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
  usePageTitle('Admin Roles & Permissions');
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
        message.success('Role saved successfully');
        setModalVisible(false);
        setEditingRole(null);
        form.resetFields();
        queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      } else {
        message.error(res?.msg || 'Failed to save role');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return HttpUtil.post(`/panel/api/admins/roles/delete/${id}`);
    },
    onSuccess: (res: any) => {
      if (res?.success) {
        message.success('Role deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      } else {
        message.error(res?.msg || 'Failed to delete role');
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
      title: 'Role Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      render: (text) => <Tag color="geekblue">{text}</Tag>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || '-',
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (perms) => (
        <code style={{ fontSize: '12px', background: 'rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: '4px' }}>
          {perms}
        </code>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 110,
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: token.colorPrimary }} />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: 'Are you sure you want to delete this role?',
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
                        title="Defined Roles"
                        value={String(roles.length)}
                        prefix={<SafetyCertificateOutlined />}
                      />
                    </Col>
                    <Col xs={12} sm={12} md={12}>
                      <Statistic
                        title="Access Model"
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
                      <span>Admin Roles & Permissions</span>
                    </Space>
                  }
                  extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                      Add New Role
                    </Button>
                  }
                >
                  <Table
                    dataSource={roles}
                    columns={columns}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: 'No Data' }}
                  />
                </Card>
              </Col>
            </Row>

            <Modal
              title={editingRole ? 'Edit Role' : 'Create New Role'}
              open={modalVisible}
              onCancel={() => setModalVisible(false)}
              onOk={() => form.submit()}
              confirmLoading={saveMutation.isPending}
            >
              <Form form={form} layout="vertical" onFinish={(vals) => saveMutation.mutate(vals)}>
                <Form.Item name="name" label="Role Name" rules={[{ required: true, message: 'Please enter role name' }]}>
                  <Input placeholder="e.g. Reseller, Support" />
                </Form.Item>
                <Form.Item name="slug" label="Unique Identifier (Slug)" rules={[{ required: true, message: 'Please enter slug' }]}>
                  <Input placeholder="e.g. reseller, operator" disabled={!!editingRole} />
                </Form.Item>
                <Form.Item name="description" label="Description">
                  <Input.TextArea placeholder="Role duties and responsibilities" />
                </Form.Item>
                <Form.Item name="permissions" label="Permissions (JSON Array)" rules={[{ required: true, message: 'Please specify permissions' }]}>
                  <Input.TextArea rows={3} placeholder='["*"] or ["clients:read", "clients:create"]' />
                </Form.Item>
              </Form>
            </Modal>
          </Layout.Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
