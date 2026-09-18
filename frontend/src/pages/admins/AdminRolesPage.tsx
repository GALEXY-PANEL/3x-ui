const JSON_HEADERS = { headers: { 'Content-Type': 'application/json' } } as const;

import { useCallback, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  Checkbox,
  Col,
  Collapse,
  ConfigProvider,
  Divider,
  Form,
  Input,
  InputNumber,
  Layout,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
  theme,
} from 'antd';
import type { TableColumnsType } from 'antd';
import {
  CheckCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  GlobalOutlined,
  LockOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  SafetyOutlined,
  SettingOutlined,
  TeamOutlined,
  ToolOutlined,
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

const PERMISSION_MODULES = [
  {
    key: 'inbounds',
    title: 'Inbounds Management',
    icon: <GlobalOutlined />,
    actions: [
      { key: 'inbounds:read', label: 'View Inbounds' },
      { key: 'inbounds:create', label: 'Create Inbound' },
      { key: 'inbounds:update', label: 'Edit Inbound' },
      { key: 'inbounds:delete', label: 'Delete Inbound' },
      { key: 'inbounds:reset_usage', label: 'Reset Inbound Traffic' },
    ],
  },
  {
    key: 'clients',
    title: 'Clients & Users',
    icon: <TeamOutlined />,
    actions: [
      { key: 'clients:read', label: 'View Clients' },
      { key: 'clients:create', label: 'Create Client' },
      { key: 'clients:update', label: 'Edit Client' },
      { key: 'clients:delete', label: 'Delete Client' },
      { key: 'clients:reset_usage', label: 'Reset Client Traffic' },
      { key: 'clients:revoke_sub', label: 'Revoke Subscription' },
    ],
  },
  {
    key: 'groups',
    title: 'Client Groups',
    icon: <SafetyOutlined />,
    actions: [
      { key: 'groups:read', label: 'View Groups' },
      { key: 'groups:create', label: 'Create Group' },
      { key: 'groups:update', label: 'Edit Group' },
      { key: 'groups:delete', label: 'Delete Group' },
    ],
  },
  {
    key: 'nodes',
    title: 'Cluster Nodes',
    icon: <ToolOutlined />,
    actions: [
      { key: 'nodes:read', label: 'View Nodes' },
      { key: 'nodes:create', label: 'Add Node' },
      { key: 'nodes:update', label: 'Edit Node' },
      { key: 'nodes:delete', label: 'Delete Node' },
    ],
  },
  {
    key: 'admins',
    title: 'Admins & Resellers',
    icon: <TeamOutlined />,
    actions: [
      { key: 'admins:read', label: 'View Admins' },
      { key: 'admins:create', label: 'Create Admin' },
      { key: 'admins:update', label: 'Edit Admin' },
      { key: 'admins:delete', label: 'Delete Admin' },
    ],
  },
  {
    key: 'settings',
    title: 'System Settings & Xray',
    icon: <SettingOutlined />,
    actions: [
      { key: 'settings:read', label: 'View Settings' },
      { key: 'settings:update', label: 'Change Settings' },
      { key: 'xray:restart', label: 'Restart Core / Xray' },
    ],
  },
];

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
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [scopeMode, setScopeMode] = useState<string>('all');

  const { data: roles = [], isLoading } = useQuery<AdminRole[]>({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const res = await HttpUtil.get('/panel/api/admins/roles');
      return res?.obj || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      const permsArray = selectedPerms.length > 0 ? selectedPerms : ['*'];
      const payload = {
        name: values.name,
        slug: values.slug,
        description: values.description,
        permissions: JSON.stringify(permsArray),
      };
      if (editingRole) {
        return HttpUtil.post(`/panel/api/admins/roles/update/${editingRole.id}`, payload, JSON_HEADERS);
      }
      return HttpUtil.post('/panel/api/admins/roles/create', payload, JSON_HEADERS);
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
    setSelectedPerms(['inbounds:read', 'clients:read', 'clients:create', 'clients:update']);
    setScopeMode('own');
    setModalVisible(true);
  };

  const openEditModal = (role: AdminRole) => {
    setEditingRole(role);
    form.setFieldsValue(role);
    try {
      const parsed = JSON.parse(role.permissions || '[]');
      if (Array.isArray(parsed)) {
        setSelectedPerms(parsed);
      } else {
        setSelectedPerms(['*']);
      }
    } catch {
      setSelectedPerms(['*']);
    }
    setModalVisible(true);
  };

  const handleDuplicate = (role: AdminRole) => {
    setEditingRole(null);
    form.setFieldsValue({
      name: `${role.name} (Copy)`,
      slug: `${role.slug}_copy`,
      description: role.description,
    });
    try {
      const parsed = JSON.parse(role.permissions || '[]');
      setSelectedPerms(Array.isArray(parsed) ? parsed : ['*']);
    } catch {
      setSelectedPerms(['*']);
    }
    setModalVisible(true);
  };

  const togglePermission = (key: string) => {
    setSelectedPerms((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const selectAllModule = (actions: { key: string }[]) => {
    const keys = actions.map((a) => a.key);
    const allSelected = keys.every((k) => selectedPerms.includes(k));
    if (allSelected) {
      setSelectedPerms((prev) => prev.filter((k) => !keys.includes(k)));
    } else {
      setSelectedPerms((prev) => Array.from(new Set([...prev, ...keys])));
    }
  };

  const columns: TableColumnsType<AdminRole> = [
    {
      title: 'Role Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space direction="vertical" size={2}>
          <strong style={{ fontSize: '15px' }}>{text}</strong>
          <Tag color="geekblue" style={{ fontSize: '11px', width: 'fit-content' }}>
            {record.slug}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || <span style={{ color: 'rgba(255,255,255,0.3)' }}>No description</span>,
    },
    {
      title: 'Permission Modules',
      key: 'permissions_summary',
      render: (_, record) => {
        let perms: string[] = [];
        try {
          const parsed = JSON.parse(record.permissions || '[]');
          if (Array.isArray(parsed)) {
            perms = parsed;
          } else if (typeof parsed === 'object' && parsed !== null) {
            perms = Object.keys(parsed);
          }
        } catch {
          if (typeof record.permissions === 'string' && record.permissions) {
            perms = [record.permissions];
          }
        }
        if (!Array.isArray(perms)) {
          perms = [];
        }
        const isSuper = perms.includes('*') || record.slug === 'owner';
        if (isSuper) {
          return <Tag color="gold" icon={<SafetyCertificateOutlined />}>Full Access (Super Admin)</Tag>;
        }
        return (
          <Space wrap size={[4, 6]}>
            {perms.map((p) => (
              <Tag key={p} color="purple" style={{ fontSize: '12px' }}>
                {p}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_, record) => {
        const isProtected = record.slug === 'owner' || record.slug === 'administrator';
        return (
          <Space size="small">
            <Tooltip title="Edit Permissions">
              <Button
                type="text"
                icon={<EditOutlined style={{ color: token.colorPrimary }} />}
                onClick={() => openEditModal(record)}
              />
            </Tooltip>
            <Tooltip title="Duplicate Role">
              <Button
                type="text"
                icon={<CopyOutlined style={{ color: token.colorSuccess }} />}
                onClick={() => handleDuplicate(record)}
              />
            </Tooltip>
            <Tooltip title={isProtected ? 'Protected System Role' : 'Delete Role'}>
              <Button
                type="text"
                danger
                disabled={isProtected}
                icon={<DeleteOutlined />}
                onClick={() => {
                  Modal.confirm({
                    title: 'Delete Role',
                    content: `Are you sure you want to delete role "${record.name}"?`,
                    onOk: () => deleteMutation.mutate(record.id),
                  });
                }}
              />
            </Tooltip>
          </Space>
        );
      },
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
                        value="Role-Based (Heimdall RBAC)"
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
              title={
                <Space>
                  <SafetyCertificateOutlined style={{ color: token.colorPrimary }} />
                  <span>{editingRole ? `Edit Role: ${editingRole.name}` : 'Create New Role'}</span>
                </Space>
              }
              open={modalVisible}
              width={750}
              onCancel={() => setModalVisible(false)}
              onOk={() => form.submit()}
              confirmLoading={saveMutation.isPending}
            >
              <Form form={form} layout="vertical" onFinish={(vals) => saveMutation.mutate(vals)}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="name"
                      label="Role Name"
                      rules={[{ required: true, message: 'Please enter role name' }]}
                    >
                      <Input placeholder="e.g. Reseller, Operator, Support" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="slug"
                      label="Slug (Identifier)"
                      rules={[{ required: true, message: 'Please enter slug' }]}
                    >
                      <Input placeholder="e.g. reseller, operator" disabled={!!editingRole} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="description" label="Description">
                  <Input.TextArea rows={2} placeholder="Description of role permissions and responsibilities" />
                </Form.Item>

                <Divider orientation="left" style={{ margin: '12px 0' }}>
                  <Space>
                    <LockOutlined />
                    <span>Granular Module Permissions (RBAC)</span>
                  </Space>
                </Divider>

                <div style={{ maxHeight: '360px', overflowY: 'auto', paddingRight: '6px' }}>
                  {PERMISSION_MODULES.map((mod) => {
                    const allInMod = mod.actions.every((a) => selectedPerms.includes(a.key));
                    return (
                      <Card
                        key={mod.key}
                        size="small"
                        style={{
                          marginBottom: '12px',
                          background: 'rgba(255,255,255,0.02)',
                          borderColor: 'rgba(255,255,255,0.08)',
                        }}
                        title={
                          <Space>
                            {mod.icon}
                            <span>{mod.title}</span>
                          </Space>
                        }
                        extra={
                          <Button size="small" type="link" onClick={() => selectAllModule(mod.actions)}>
                            {allInMod ? 'Deselect All' : 'Select All'}
                          </Button>
                        }
                      >
                        <Row gutter={[12, 10]}>
                          {mod.actions.map((act) => (
                            <Col span={12} key={act.key}>
                              <Checkbox
                                checked={selectedPerms.includes(act.key) || selectedPerms.includes('*')}
                                onChange={() => togglePermission(act.key)}
                              >
                                {act.label}
                              </Checkbox>
                            </Col>
                          ))}
                        </Row>
                      </Card>
                    );
                  })}
                </div>
              </Form>
            </Modal>
          </Layout.Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
