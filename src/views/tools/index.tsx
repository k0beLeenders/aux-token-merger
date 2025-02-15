import React, { useCallback } from "react";
import { sendTransaction, useConnection, } from "../../contexts/connection";
import { TransactionInstruction } from "@solana/web3.js";
import { notify } from "../../utils/notifications";
import { LABELS } from "../../constants";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Row, Col, Collapse, Space } from 'antd';
import { migrateTokens } from "../../actions";
import { CheckCircleFilled, InfoCircleFilled, ToolFilled } from "@ant-design/icons";
import { useUserAccounts, useGroupedAuxTokenAccounts, useAssociatedTokenAccounts } from "../../hooks";
import { MigrateableTokenDisplay } from "../../components/MigrateableTokenDisplay";

export const AccountToolsView = () => {
  const connection = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const { Panel } = Collapse;
  const groupedAuxTokenAccounts = useGroupedAuxTokenAccounts();
  const userAccounts = useUserAccounts();
  const { ataMap } = useAssociatedTokenAccounts();

  const clickMigrate = useCallback(async (e?: React.MouseEvent<HTMLElement, MouseEvent>) => {
    const mint = e?.currentTarget.id;
    try {
      if (!groupedAuxTokenAccounts || !publicKey) {
        return;
      }
      let instructions: TransactionInstruction[] = [];
      const signers: any = []

      migrateTokens(instructions, groupedAuxTokenAccounts, ataMap, publicKey, [], mint ? new PublicKey(mint) : undefined);

      // Walletadapter type doesn't work correctly
      const hackyWallet = { publicKey: publicKey, signTransaction: signTransaction } as any;
      
      const result = await sendTransaction(connection, hackyWallet, instructions, signers);

      notify({
        message: LABELS.MIGRATED,
        type: "success",
      });
    } catch (error) {
      notify({
        message: LABELS.MIGRATE_FAILED,
        type: "error",
      });
      console.error(error);
    }

  }, [publicKey, connection, userAccounts, groupedAuxTokenAccounts]);

  return (
    <Row id='tools-page' className='tools-page'>
      <Col className='tools-bar' span={4}>
      </Col>
      <Col span={20}>
        <div>
          <div className="tools-title">
            <ToolFilled color='white' /> Account Cleanup Tools
          </div>
          <Space >
            <div id='tool-collapse'>
              <Collapse ghost>
                {groupedAuxTokenAccounts.size !== 0 ? (
                  <Panel className="tools-custom-collapsed" showArrow={false} header={<div><InfoCircleFilled /> Migrate Associated Token Accounts</div>} key="1">
                    <div className="tools-subtext">
                      <span>
                        Some dApps on Solana create new addresses for each token you own in form of <a style={{ color: '#05bb8c' }} href="https://spl.solana.com/associated-token-account">associated token accounts</a>.
                        You can use this page to migrate these tokens to your main address.
                      </span>
                      <div className="tools-infotext">
                        <Row>
                          <Col span={19}>
                            <span>
                              {groupedAuxTokenAccounts.size} accounts requiring migration
                            </span>
                          </Col>
                          <Col span={5}>
                            <div>
                              <button className='step-button' onClick={(e) => { clickMigrate() }}>Migrate All</button>
                            </div>
                          </Col>

                        </Row>

                      </div>
                      <MigrateableTokenDisplay onClick={(e) => { clickMigrate(e) }} />
                    </div>
                  </Panel>
                ) : (
                  <Panel className="tools-custom-collapsed" collapsible="disabled" showArrow={false} header={<div><CheckCircleFilled color='#06d6a0' /> No Associated Token Accounts to migrate</div>} key="1">

                  </Panel>
                )}
                <Panel className="tools-custom-collapsed" collapsible="disabled" showArrow={false} header={<div><CheckCircleFilled color='#06d6a0' /> No Open Order Accounts on Serum to close</div>} key="2">
                </Panel>
                <Panel className="tools-custom-collapsed" collapsible="disabled" showArrow={false} header={<div><CheckCircleFilled color='#06d6a0' /> No Unititialised Accounts to close</div>} key="3">
                </Panel>
              </Collapse>
            </div>
          </Space>
        </div>
      </Col>
    </Row>
  );
};
