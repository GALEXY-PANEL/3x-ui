import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  Col,
  ConfigProvider,
  Form,
  Input,
  InputNumber,
  Layout,
  Modal,
  Row,
  Select,
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
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  TeamOutlined,
  UserOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useTheme } from '@/hooks/useTheme';
import { useMediaQuery } from '@/hooks/useMediaQuery';
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
  usePageTitle('Admin & Reseller Management');
  const { isDark, isUltra, antdThemeConfig } = useTheme();
  const { isMobile } = useMediaQuery();
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

  const totalAdmins = admins.length;
  const activeAdmins = admins.filter((a) => a.status === 'active').length;
  const totalTraffic = admins.reduce((acc, a) => acc + (a.usedBytes || 0), 0);

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
        message.success('Admin saved successfully');
        setModalVisible(false);
        setEditingAdmin(null);
        form.resetFields();
        queryClient.invalidateQueries({ queryKey: ['admins-list'] });
      } else {
        message.error(res?.msg || 'Failed to save admin');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return HttpUtil.post(`/panel/api/admins/delete/${id}`);
    },
    onSuccess: (res: any) => {
      if (res?.success) {
        message.success('Admin deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['admins-list'] });
      } else {
        message.error(res?.msg || 'Failed to delete admin');
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
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      render: (text) => (
        <Space>
          <UserOutlined style={{ color: token.colorPrimary }} />
          <strong>{text}</strong>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'roleId',
      key: 'roleId',
      render: (id) => <Tag color="geekblue">{roleMap[id] || `Role #${id}`}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'success' : 'error'} icon={status === 'active' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {status === 'active' ? 'Active' : 'Disabled'}
        </Tag>
      ),
    },
    {
      title: 'Traffic Usage / Limit',
      key: 'traffic',
      render: (_, record) => (
        <span>
          {SizeFormatter.sizeFormat(record.usedBytes || 0)} /{' '}
          {record.dataLimit > 0 ? SizeFormatter.sizeFormat(record.dataLimit) : 'Unlimited'}
        </span>
      ),
    },
    {
      title: 'Note',
      dataIndex: 'note',
      key: 'note',
      render: (text) => text || '-',
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
                  title: 'Are you sure you want to delete this admin?',
                  onOk: () => deleteMutation.mutate(record.id),
                });
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const pageClass = `clients-page${isDark ? ' is-dark' : ''}${isUltra ? ' is-ultra' : ''}`;

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
                    <Col xs={12} sm={12} md={8}>
                      <Statistic
                        title="Total Admins"
                        value={String(totalAdmins)}
                        prefix={<TeamOutlined />}
                      />
                    </Col>
                    <Col xs={12} sm={12} md={8}>
                      <Statistic
                        title="Active Admins"
                        value={String(activeAdmins)}
                        prefix={<CheckCircleOutlined />}
                      />
                    </Col>
                    <Col xs={24} sm={24} md={8}>
                      <Statistic
                        title="Total Admin Traffic"
                        value={SizeFormatter.sizeFormat(totalTraffic)}
                        prefix={<PieChartOutlined />}
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
                      <TeamOutlined style={{ color: token.colorPrimary }} />
                      <span>Admins & Resellers</span>
                    </Space>
                  }
                  extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                      Add New Admin
                    </Button>
                  }
                >
                  <Table
                    dataSource={admins}
                    columns={columns}
                    rowKey="id"
                    loading={isLoadingAdmins}
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: 'No Data' }}
                  />
                </Card>
              </Col>
            </Row>

            <Modal
              title={editingAdmin ? 'Edit Admin' : 'Create New Admin'}
              open={modalVisible}
              onCancel={() => setModalVisible(false)}
              onOk={() => form.submit()}
              confirmLoading={saveMutation.isPending}
            >
              <Form form={form} layout="vertical" onFinish={(vals) => saveMutation.mutate(vals)}>
                <Form.Item name="username" label="Username" rules={[{ required: true, message: 'Please enter username' }]}>
                  <Input placeholder="username" disabled={!!editingAdmin} />
                </Form.Item>
                <Form.Item
                  name="password"
                  label="Password"
                  rules={[{ required: !editingAdmin, message: 'Please enter password' }]}
                >
                  <Input.Password placeholder={editingAdmin ? 'Leave blank to keep current' : 'password'} />
                </Form.Item>
                <Form.Item name="roleId" label="Role" rules={[{ required: true, message: 'Please select a role' }]}>
                  <Select
                    options={roles.map((r) => ({ label: r.name, value: r.id }))}
                    placeholder="Select role"
                  />
                </Form.Item>
                <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                  <Select
                    options={[
                      { label: 'Active', value: 'active' },
                      { label: 'Disabled', value: 'disabled' },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="dataLimitGB" label="Traffic Limit (GB)">
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="0 = Unlimited" />
                </Form.Item>
                <Form.Item name="note" label="Note">
                  <Input.TextArea placeholder="Notes & remarks" />
                </Form.Item>
              </Form>
            </Modal>
          </Layout.Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
