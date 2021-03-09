import React, { FC, useEffect, useState } from 'react';
import { Input, Select, InlineField, ButtonGroup, ToolbarButton, FieldSet } from '@grafana/ui';
import {
  DataSourcePluginOptionsEditorProps,
  onUpdateDatasourceJsonDataOptionSelect,
  onUpdateDatasourceResetOption,
  onUpdateDatasourceJsonDataOption,
  onUpdateDatasourceSecureJsonDataOption,
} from '@grafana/data';
import { config } from '@grafana/runtime';

import { awsAuthProviderOptions, standardRegions, AwsAuthDataSourceJsonData, AwsAuthDataSourceSecureJsonData } from '.';

const toOption = (value: string) => ({ value, label: value });

interface Props extends DataSourcePluginOptionsEditorProps<AwsAuthDataSourceJsonData, AwsAuthDataSourceSecureJsonData> {
  standardRegions?: string[];
  loadRegions?: () => Promise<string[]>;
  defaultEndpoint?: string;
  children?: React.ReactNode;
}

export const ConnectionConfig: FC<Props> = (props: Props) => {
  const [regions, setRegions] = useState((props.standardRegions || standardRegions).map(toOption));

  useEffect(() => {
    if (!props.loadRegions) {
      return;
    }

    props.loadRegions().then(regions => setRegions(regions.map(toOption)));
  }, [props.loadRegions]);

  const options = props.options;
  let profile = options.jsonData.profile;
  if (profile === undefined) {
    profile = options.database;
  }

  return (
    <FieldSet label="Connection Details">
      <InlineField
        label="Authentication Provider"
        labelWidth={28}
        tooltip="Specify which AWS credentials chain to use. AWS SDK Default is the recommended option for EKS, ECS, or if you've attached an IAM role to your EC2 instance."
      >
        <Select
          className="width-30"
          value={awsAuthProviderOptions.find(p => p.value === options.jsonData.authType) || awsAuthProviderOptions[0]}
          options={awsAuthProviderOptions.filter(opt => config.awsAllowedAuthProviders.includes(opt.value!))}
          defaultValue={options.jsonData.authType}
          onChange={option => {
            onUpdateDatasourceJsonDataOptionSelect(props, 'authType')(option);
          }}
        />
      </InlineField>
      {options.jsonData.authType === 'credentials' && (
        <InlineField
          label="Credentials Profile Name"
          labelWidth={28}
          tooltip="Credentials profile name, as specified in ~/.aws/credentials, leave blank for default."
        >
          <Input
            className="width-30"
            placeholder="default"
            value={profile}
            onChange={onUpdateDatasourceJsonDataOption(props, 'profile')}
          />
        </InlineField>
      )}

      {options.jsonData.authType === 'keys' && (
        <>
          <InlineField label="Access Key ID" labelWidth={28}>
            {props.options.secureJsonFields?.accessKey ? (
              <ButtonGroup className="width-30">
                <Input disabled placeholder="Configured" />
                <ToolbarButton icon="edit" onClick={onUpdateDatasourceResetOption(props as any, 'accessKey')} />
              </ButtonGroup>
            ) : (
              <Input
                className="width-30"
                value={options.secureJsonData?.accessKey ?? ''}
                onChange={onUpdateDatasourceSecureJsonDataOption(props, 'accessKey')}
              />
            )}
          </InlineField>

          <InlineField label="Secret Access Key" labelWidth={28}>
            {props.options.secureJsonFields?.secretKey ? (
              <ButtonGroup className="width-30">
                <Input disabled placeholder="Configured" />
                <ToolbarButton icon="edit" onClick={onUpdateDatasourceResetOption(props as any, 'secretKey')} />
              </ButtonGroup>
            ) : (
              <Input
                className="width-30"
                value={options.secureJsonData?.secretKey ?? ''}
                onChange={onUpdateDatasourceSecureJsonDataOption(props, 'secretKey')}
              />
            )}
          </InlineField>
        </>
      )}

      {config.awsAssumeRoleEnabled && (
        <>
          <InlineField
            label="Assume Role ARN"
            labelWidth={28}
            tooltip="Optionally, specify the ARN of a role to assume. Specifying a role here will ensure that the selected authentication provider is used to assume the specified role rather than using the credentials directly. Leave blank if you don't need to assume a role at all"
          >
            <Input
              className="width-30"
              placeholder="arn:aws:iam:*"
              value={options.jsonData.assumeRoleArn || ''}
              onChange={onUpdateDatasourceJsonDataOption(props, 'assumeRoleArn')}
            />
          </InlineField>
          <InlineField
            label="External ID"
            labelWidth={28}
            tooltip="If you are assuming a role in another account, that has been created with an external ID, specify the external ID here."
          >
            <Input
              className="width-30"
              placeholder="External ID"
              value={options.jsonData.externalId || ''}
              onChange={onUpdateDatasourceJsonDataOption(props, 'externalId')}
            />
          </InlineField>
        </>
      )}
      <InlineField label="Endpoint" labelWidth={28} tooltip="Optionally, specify a custom endpoint for the service">
        <Input
          className="width-30"
          placeholder={props.defaultEndpoint ?? 'https://{service}.{region}.amazonaws.com'}
          value={options.jsonData.endpoint || ''}
          onChange={onUpdateDatasourceJsonDataOption(props, 'endpoint')}
        />
      </InlineField>
      <InlineField
        label="Default Region"
        labelWidth={28}
        tooltip="Specify the region, such as for US West (Oregon) use ` us-west-2 ` as the region."
      >
        <Select
          className="width-30"
          value={regions.find(region => region.value === options.jsonData.defaultRegion)}
          options={regions}
          defaultValue={options.jsonData.defaultRegion}
          allowCustomValue={true}
          onChange={onUpdateDatasourceJsonDataOptionSelect(props, 'defaultRegion')}
        />
      </InlineField>
      {props.children}
    </FieldSet>
  );
};